const prisma = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { v4: uuidv4 } = require("uuid");

async function listExperiments(orgId, filters) {
  const { country, result, product, search, page = 1, limit = 20 } = filters;
  const where = { organizationId: orgId };

  if (country) where.country = country;
  if (result) where.result = result;
  if (product) where.product = product;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [experiments, total] = await Promise.all([
    prisma.experiment.findMany({
      where,
      include: { tags: true, author: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    }),
    prisma.experiment.count({ where }),
  ]);

  return { experiments, total, page: parseInt(page), limit: parseInt(limit) };
}

async function getExperimentById(orgId, experimentId) {
  const experiment = await prisma.experiment.findFirst({
    where: { id: experimentId, organizationId: orgId },
    include: {
      tags: true,
      author: { select: { name: true, avatar: true, email: true } },
      campaign: { select: { name: true, country: true } },
      memories: true,
      comments: {
        include: { author: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!experiment) throw ApiError.notFound("Experiment not found");
  return experiment;
}

async function createExperiment(orgId, authorId, data) {
  const experiment = await prisma.experiment.create({
    data: {
      id: uuidv4(),
      organizationId: orgId,
      authorId,
      title: data.title,
      description: data.description,
      campaignId: data.campaignId,
      country: data.country,
      product: data.product,
      category: data.category,
      budget: data.budget,
      actualSpend: data.actualSpend,
      roas: data.roas,
      cpa: data.cpa,
      revenue: data.revenue,
      profit: data.profit,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      creativeType: data.creativeType,
      audience: data.audience,
      result: data.result || "UNKNOWN",
      lessonsLearned: data.lessonsLearned,
      mistakes: data.mistakes,
      recommendations: data.recommendations,
    },
  });

  if (data.tags && data.tags.length > 0) {
    await prisma.experimentTag.createMany({
      data: data.tags.map((tag) => ({ id: uuidv4(), experimentId: experiment.id, tag })),
    });
  }

  return experiment;
}

async function updateExperiment(orgId, experimentId, data) {
  const existing = await prisma.experiment.findFirst({
    where: { id: experimentId, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound("Experiment not found");

  const experiment = await prisma.experiment.update({
    where: { id: experimentId },
    data: {
      title: data.title,
      description: data.description,
      country: data.country,
      product: data.product,
      category: data.category,
      budget: data.budget,
      actualSpend: data.actualSpend,
      roas: data.roas,
      cpa: data.cpa,
      revenue: data.revenue,
      profit: data.profit,
      result: data.result,
      lessonsLearned: data.lessonsLearned,
      mistakes: data.mistakes,
      recommendations: data.recommendations,
      creativeType: data.creativeType,
      audience: data.audience,
    },
  });

  return experiment;
}

async function deleteExperiment(orgId, experimentId) {
  const existing = await prisma.experiment.findFirst({
    where: { id: experimentId, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound("Experiment not found");

  await prisma.experimentTag.deleteMany({ where: { experimentId } });
  await prisma.experiment.delete({ where: { id: experimentId } });
}

async function getStats(orgId) {
  const byResult = await prisma.experiment.groupBy({
    by: ["result"],
    where: { organizationId: orgId },
    _count: true,
  });

  const aggregated = await prisma.experiment.aggregate({
    where: { organizationId: orgId },
    _avg: { roas: true, cpa: true },
    _sum: { budget: true, revenue: true, profit: true },
    _count: true,
  });

  return { byResult, aggregates: aggregated };
}

module.exports = { listExperiments, getExperimentById, createExperiment, updateExperiment, deleteExperiment, getStats };
