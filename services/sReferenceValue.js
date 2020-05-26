const models = require("../models");
const { throwException } = require("../global/helpers");

async function getReferenceValue(id) {
  const referenceValue = await models.ExaminationValue.findByPk(id, {
    nest: true,
    include: [
      {
        model: models.ExaminationReferenceValue,
        as: "examinationReferenceValues",
      },
      {
        model: models.ExaminationGroup,
      },
      {
        model: models.Unit,
      },
      {
        model: models.Method,
      },
    ],
  });
  if (!referenceValue) {
    throwException("E011");
  }
  return referenceValue;
}

async function getExamValuebyExamId(id) {
  const referenceValue = await models.ExaminationValue.findAll({
    nest: true,
    include: [
      {
        model: models.ExaminationReferenceValue,
        as: "examinationReferenceValues",
      },
      {
        model: models.ExaminationGroup,
        // where: { "$ExaminationGroup.ExaminationId$": id },
        where: { ExaminationId: id },
      },
      {
        model: models.Unit,
      },
      {
        model: models.Method,
      },
    ],
  });
  if (!referenceValue) {
    throwException("E011");
  }
  return referenceValue;
}

async function getPagedReferenceValue(offset, limit) {
  const { count: total, rows } = await models.ExaminationValue.findAndCountAll({
    offset,
    limit,
    nest: true,
    include: [
      {
        model: models.ExaminationReferenceValue,
        as: "examinationReferenceValues",
      },
      {
        model: models.ExaminationGroup,
      },
      {
        model: models.Unit,
      },
      {
        model: models.Method,
      },
    ],
  });

  const result = {
    total,
    rows,
    count: rows.length,
  };

  return result;
}

async function getAllReferenceValue() {
  return await models.ExaminationValue.findAll({
    nest: true,
    include: [
      {
        model: models.ExaminationReferenceValue,
        as: "examinationReferenceValues",
      },
      {
        model: models.ExaminationGroup,
      },
      {
        model: models.Unit,
      },
      {
        model: models.Method,
      },
    ],
  });
}

async function createReferenceValue(data) {
  await models.ExaminationValue.create(data);
}

async function updateReferenceValue(id, data) {
  const referenceValue = await getReferenceValue(id);
  await referenceValue.update(data);
}

async function destroyReferenceValue(id) {
  const referenceValue = await getReferenceValue(id);
  await referenceValue.destroy();
}

module.exports = {
  getReferenceValue,
  getAllReferenceValue,
  getExamValuebyExamId,
  getPagedReferenceValue,
  createReferenceValue,
  updateReferenceValue,
  destroyReferenceValue,
};
