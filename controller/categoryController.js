import prisma from "../lib/prisma.js";

export class CategoryController {
  // Get all categories (public endpoint - no auth required)
  static getCategories = async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      });

      return res.status(200).json({
        message: "Categories retrieved successfully",
        categories,
        count: categories.length,
      });
    } catch (error) {
      console.error("[Category] getCategories failed:", error);
      return res.status(500).json({ message: "Failed to retrieve categories" });
    }
  };

  // Get category by ID (public endpoint - no auth required)
  static getCategoryById = async (req, res) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              issues: true,
            },
          },
        },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      return res.status(200).json({
        message: "Category retrieved successfully",
        category: {
          ...category,
          issueCount: category._count.issues,
        },
      });
    } catch (error) {
      console.error("[Category] getCategoryById failed:", error);
      return res.status(500).json({ message: "Failed to retrieve category" });
    }
  };
}

