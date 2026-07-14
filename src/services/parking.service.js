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
    const categoryWhere = {};

    if (filters.plate) {
      where.plate = { [Op.iLike]: `%${filters.plate}%` };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.entryTime = {};
      if (filters.dateFrom) {
        where.entryTime[Op.gte] = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.entryTime[Op.lte] = new Date(filters.dateTo);
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

    let order = [['entryTime', 'DESC']];
    if (filters.sortBy) {
      order = [[filters.sortBy, filters.sortOrder || 'ASC']];
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
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Estacionamiento', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString()}`, { align: 'center' });

      if (plate) {
        doc.moveDown(0.3);
        doc.fontSize(12).font('Helvetica-Bold').text(`Vehículo: ${plate}`, { align: 'center' });
      }

      doc.moveDown(1);

      const columns = ['Placa', 'Categoría', 'Entrada', 'Salida', 'Min', 'Costo', 'Estado', 'Registrado'];
      const colWidths = [70, 80, 100, 100, 40, 50, 60, 90];
      const startX = 50;
      const startY = doc.y;
      const rowHeight = 20;
      const headerY = doc.y;

      doc.font('Helvetica-Bold').fontSize(9);
      let x = startX;
      columns.forEach((col, i) => {
        doc.text(col, x, headerY, { width: colWidths[i], align: 'center' });
        x += colWidths[i];
      });

      doc.moveTo(startX, headerY + rowHeight).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), headerY + rowHeight).stroke();
      doc.moveTo(startX, headerY).lineTo(startX, headerY + rowHeight).stroke();
      x = startX;
      colWidths.forEach((w) => {
        x += w;
        doc.moveTo(x, headerY).lineTo(x, headerY + rowHeight).stroke();
      });

      doc.font('Helvetica').fontSize(8);
      let y = headerY + rowHeight;

      records.forEach((r, idx) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
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
          doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#f5f5f5');
        }

        x = startX;
        rowData.forEach((cell, i) => {
          doc.text(cell, x, y + 2, { width: colWidths[i], align: 'center' });
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
