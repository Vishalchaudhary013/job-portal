import customCategory from "../models/customCategoryModel.js";
import { DEFAULT_CATEGORIES_BY_TYPE } from "../constants/jobCategories.js";

const createSlug = (text = "") => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// `slug` carries a global unique index, so a bare title slug would make the same
// category name unusable across opportunity types — "Sales" as a Jobs category
// would collide with "Sales" under Degree Programs. New rows get the type baked
// into the slug; rows written before this (plain title slugs) are left alone,
// which is why identity is matched on title + type below rather than on slug.
const buildSlug = (title, opportunityType) =>
  `${createSlug(opportunityType)}-${createSlug(title)}`;

// Matches a category by what actually identifies it to an admin: its title
// within one opportunity type, case- and spacing-insensitive.
const findByTitle = (title, opportunityType) =>
  customCategory.findOne({
    opportunityType,
    title: new RegExp(`^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });

// Opportunity types already seeded in this process. The upserts below are
// idempotent, so this is only there to keep every listing request from issuing
// two dozen no-op writes.
const seededTypes = new Set();

// Inserts the built-in categories for `opportunityType` (currently only Jobs)
// the first time they're listed. `$setOnInsert` means an admin's edits — a
// renamed title, different colors, or a category they deactivated by deleting
// it — are never overwritten on a later boot.
const ensureDefaultCategories = async (opportunityType) => {
  const defaults = DEFAULT_CATEGORIES_BY_TYPE[opportunityType];
  if (!defaults?.length || seededTypes.has(opportunityType)) return;

  await customCategory.bulkWrite(
    defaults.map((title) => ({
      updateOne: {
        filter: { opportunityType, title },
        update: {
          $setOnInsert: {
            title,
            slug: buildSlug(title, opportunityType),
            opportunityType,
            isActive: true,
            isDefault: true,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  seededTypes.add(opportunityType);
};

export const createCustomCategory = async (req, res) => {
  try {
    const { title, opportunityType, colors, isActive } = req.body;

    if (!title || !opportunityType) {
      return res.status(400).json({
        success: false,
        message: "Title and Opportunity type is required",
      });
    }

    const existingCategory = await findByTitle(title, opportunityType.trim());
    if (existingCategory) {
      // A deactivated category (deleted earlier, or a default that was removed)
      // is re-added rather than rejected — the admin is asking for it back.
      if (!existingCategory.isActive) {
        existingCategory.isActive = true;
        existingCategory.title = title.trim();
        existingCategory.opportunityType = opportunityType.trim();
        await existingCategory.save();

        return res.status(200).json({
          success: true,
          message: "Category restored successfully",
          category: existingCategory,
        });
      }

      return res.status(409).json({
        success: false,
        message: "A category with this title already exists",
      });
    }

    const category = await customCategory.create({
      title: title.trim(),
      slug: buildSlug(title, opportunityType),
      opportunityType: opportunityType.trim(),
      colors: {
        bg: colors?.bg || "#EEF2FF",
        mid: colors?.mid || "#818CF8",
        dark: colors?.dark || "#4F46E5",
      },
      isActive: isActive ?? true,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllCustomCategories = async (req, res) => {
  try {
    const { opportunityType } = req.query;
    const filter = { isActive: true };
    if (opportunityType) {
      filter.opportunityType = opportunityType;
      // Best-effort: whatever is already stored is still worth returning if the
      // seeding write fails, and leaving the type unmarked lets it retry.
      try {
        await ensureDefaultCategories(opportunityType);
      } catch (seedError) {
        console.error("Failed to seed default categories:", seedError.message);
      }
    }

    const categories = await customCategory.find(filter).sort({ title: 1 });

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomCategory = async (req, res) => {
  try {
    const category = await customCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCustomCategory = async (req, res) => {
  try {
    const { title, opportunityType, colors, isActive } = req.body;

    const category = await customCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (title) {
      // Scoped to the category's own opportunity type: the same title under a
      // different type is a different category, not a clash.
      const targetType = (opportunityType || category.opportunityType).trim();
      const titleAlreadyUsed = await findByTitle(title, targetType);

      if (titleAlreadyUsed && String(titleAlreadyUsed._id) !== String(req.params.id)) {
        return res.status(409).json({
          success: false,
          message: "Another category already uses this title",
        });
      }

      category.title = title.trim();
      category.slug = buildSlug(title, targetType);
    }
    

    if (opportunityType) {
      category.opportunityType = opportunityType.trim();
    }
    if (colors) {
      category.colors = {
        bg: colors.bg || category.colors.bg,
        mid: colors.mid || category.colors.mid,
        dark: colors.dark || category.colors.dark,
      };
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteCustomCategory = async (req,res) => {

  try {
    const category = await customCategory.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success:false,
        message:"Category not found"
      })

    }

    // Built-ins are deactivated instead of removed; a hard delete would just be
    // undone by the seeder on the next boot.
    if (category.isDefault) {
      category.isActive = false
      await category.save()
    } else {
      await category.deleteOne()
    }

    return res.status(200).json({
      success:true,
      message:"Category deleted successfully "
    })

  } catch (error) {
    return res.status(500).json({
      success:false,
      message:error.message
    })
    
  }
}


