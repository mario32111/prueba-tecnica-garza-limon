const boom = require('@hapi/boom');
const { models } = require('../libs/sequelize');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

class ParkingService {
  async registerEntry(plate, categoryId, userId) {
    const activeRecord = await models.ParkingRecord.findOne({
      where: { plate, status: 'active' },
    });
    if (activeRecord) {
      throw boom.conflict('Plate already has an active parking record');
    }

    const category = await models.Category.findByPk(categoryId);
    if (!category || !category.isActive) {
      throw boom.notFound('Category not found or inactive');
    }

    const record = await models.ParkingRecord.create({
      plate,
      categoryId,
      registeredBy: userId,
      status: 'active',
    });

    return record;
  }

  async registerExit(plate) {
    const record = await models.ParkingRecord.findOne({
      where: { plate, status: 'active' },
      include: [{ model: models.Category, as: 'category' }],
    });

    if (!record) {
      throw boom.notFound('No active parking record found for this plate');
    }

    const now = new Date();
    const entryTime = new Date(record.entryTime);
    const diffMs = now.getTime() - entryTime.getTime();
    const totalMinutes = Math.ceil(diffMs / 60000);
    const pricePerMinute = parseFloat(record.category.pricePerMinute);
    const totalCost = totalMinutes * pricePerMinute;

    await record.update({
      exitTime: now,
      totalMinutes,
      totalCost,
      status: 'completed',
    });

    return record;
  }

  async findActive() {
    const records = await models.ParkingRecord.findAll({
      where: { status: 'active' },
      include: [
        { model: models.Category, as: 'category' },
        { model: models.User, as: 'registeredByUser', attributes: ['id', 'name'] },
      ],
      order: [['entryTime', 'ASC']],
    });
    return records;
  }

  async findAll(filters = {}) {
    const where = {};

    if (filters.plate) {
      where.plate = { [Op.iLike]: `%${filters.plate}%` };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.entryTime = {};
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        where.entryTime[Op.gte] = from;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        where.entryTime[Op.lte] = to;
      }
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.minCost !== undefined || filters.maxCost !== undefined) {
      where.totalCost = {};
      if (filters.minCost !== undefined) {
        where.totalCost[Op.gte] = parseFloat(filters.minCost);
      }
      if (filters.maxCost !== undefined) {
        where.totalCost[Op.lte] = parseFloat(filters.maxCost);
      }
    }
    if (filters.minMinutes !== undefined || filters.maxMinutes !== undefined) {
      where.totalMinutes = {};
      if (filters.minMinutes !== undefined) {
        where.totalMinutes[Op.gte] = parseInt(filters.minMinutes);
      }
      if (filters.maxMinutes !== undefined) {
        where.totalMinutes[Op.lte] = parseInt(filters.maxMinutes);
      }
    }

    const columnMap = {
      plate: 'plate',
      entry_time: 'entryTime',
      exit_time: 'exitTime',
      total_cost: 'totalCost',
      total_minutes: 'totalMinutes',
    };

    let order = [['entryTime', 'DESC']];
    if (filters.sortBy) {
      const col = columnMap[filters.sortBy] || filters.sortBy;
      order = [[col, filters.sortOrder || 'ASC']];
    }

    const records = await models.ParkingRecord.findAll({
      where,
      include: [
        { model: models.Category, as: 'category' },
        { model: models.User, as: 'registeredByUser', attributes: ['id', 'name'] },
      ],
      order,
    });
    return records;
  }

  async findByPlate(plate) {
    const records = await models.ParkingRecord.findAll({
      where: { plate: { [Op.iLike]: `%${plate}%` } },
      include: [
        { model: models.Category, as: 'category' },
        { model: models.User, as: 'registeredByUser', attributes: ['id', 'name'] },
      ],
      order: [['entryTime', 'DESC']],
    });
    if (!records || records.length === 0) {
      throw boom.notFound('No records found for this plate');
    }
    return records;
  }

  async exportToExcel(filters = {}) {
    const records = await this.findAll(filters);

    const data = records.map((r) => ({
      Placa: r.plate,
      Categoria: r.category ? r.category.name : '',
      Entrada: new Date(r.entryTime).toLocaleString(),
      Salida: r.exitTime ? new Date(r.exitTime).toLocaleString() : 'Activo',
      Minutos: r.totalMinutes || 0,
      Costo: parseFloat(r.totalCost || 0),
      Estado: r.status === 'active' ? 'Activo' : 'Completado',
      RegistradoPor: r.registeredByUser ? r.registeredByUser.name : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportToPdf(filters = {}, plate = null) {
    const records = await this.findAll(filters);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'landscape' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const startX = 40;
      const rowHeight = 18;
      const pageHeight = doc.page.height - 80;

      doc.fontSize(16).font('Helvetica-Bold').text('Reporte de Estacionamiento', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').text(`Generado: ${new Date().toLocaleString()}`, { align: 'center' });

      if (plate) {
        doc.moveDown(0.2);
        doc.fontSize(11).font('Helvetica-Bold').text(`Vehículo: ${plate}`, { align: 'center' });
      }

      doc.moveDown(0.5);

      const columns = ['Placa', 'Categoría', 'Entrada', 'Salida', 'Min', 'Costo', 'Estado', 'Registrado'];
      const colWidths = [65, 75, 110, 110, 40, 55, 55, 90];

      function drawHeader(doc, y) {
        doc.font('Helvetica-Bold').fontSize(8);
        let x = startX;
        columns.forEach((col, i) => {
          doc.text(col, x, y, { width: colWidths[i], align: 'center', lineBreak: false });
          x += colWidths[i];
        });
        doc.moveTo(startX, y + rowHeight).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y + rowHeight).stroke();
        x = startX;
        colWidths.forEach((w) => {
          x += w;
          doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
        });
      }

      let y = doc.y;
      drawHeader(doc, y);
      y += rowHeight;

      doc.font('Helvetica').fontSize(7);

      records.forEach((r, idx) => {
        if (y + rowHeight > pageHeight) {
          doc.addPage();
          y = 40;
          drawHeader(doc, y);
          y += rowHeight;
        }

        const rowData = [
          r.plate,
          r.category ? r.category.name : '',
          new Date(r.entryTime).toLocaleString(),
          r.exitTime ? new Date(r.exitTime).toLocaleString() : 'Activo',
          String(r.totalMinutes || 0),
          `$${parseFloat(r.totalCost || 0).toFixed(2)}`,
          r.status === 'active' ? 'Activo' : 'Completado',
          r.registeredByUser ? r.registeredByUser.name : '',
        ];

        if (idx % 2 === 1) {
          doc.fillColor('#f5f5f5').rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
          doc.fillColor('#000000');
        }

        let x = startX;
        rowData.forEach((cell, i) => {
          const text = String(cell);
          const maxWidth = colWidths[i] - 4;
          doc.text(text, x, y + 2, { width: maxWidth, align: 'center', lineBreak: false, ellipsis: true });
          x += colWidths[i];
        });

        doc.moveTo(startX, y + rowHeight).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y + rowHeight).stroke();
        x = startX;
        colWidths.forEach((w) => {
          x += w;
          doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
        });

        y += rowHeight;
      });

      doc.end();
    });
  }
}

module.exports = ParkingService;
