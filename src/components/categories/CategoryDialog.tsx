'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryInput } from '@/utils/validation';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { CURATED_COLORS, CURATED_ICONS } from '@/config/category-constants';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Loader2, X } from 'lucide-react';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    isSystem: boolean;
  } | null;
}

export function CategoryDialog({ isOpen, onClose, categoryToEdit }: CategoryDialogProps) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isEdit = !!categoryToEdit;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'grid',
      color: 'indigo',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setValue('name', categoryToEdit.name);
        setValue('icon', categoryToEdit.icon);
        setValue('color', categoryToEdit.color);
      } else {
        reset({
          name: '',
          icon: 'grid',
          color: 'indigo',
        });
      }
    }
  }, [isOpen, categoryToEdit, setValue, reset]);

  const onSubmit = async (data: CategoryInput) => {
    try {
      if (isEdit && categoryToEdit) {
        await updateMutation.mutateAsync({
          id: categoryToEdit.id,
          data: {
            name: data.name,
            icon: data.icon,
            color: data.color,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          icon: data.icon,
          color: data.color,
        });
      }
      onClose();
    } catch {
      // Handled inside queries
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#EAEAEA] shrink-0">
          <h2 className="text-lg font-bold text-[#111111]">
            {isEdit ? 'Edit Category' : 'Create Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#707070] hover:text-[#111111] p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="cat-name">
              Category Name
            </label>
            <input
              id="cat-name"
              type="text"
              placeholder="e.g. Groceries, Subscriptions"
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              {...register('name')}
              disabled={isSubmitting || categoryToEdit?.isSystem}
            />
            {categoryToEdit?.isSystem && (
              <p className="text-[10px] text-[#A0A0A0]">System categories are protected and cannot be renamed.</p>
            )}
            {errors.name && (
              <p className="text-xs text-danger font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]">
              Theme Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {CURATED_COLORS.map((colorName) => {
                const colorSet = getCategoryColorClasses(colorName);
                const isSelected = selectedColor === colorName;

                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setValue('color', colorName)}
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                      colorSet.fill
                    } ${
                      isSelected
                        ? 'ring-2 ring-black ring-offset-2 ring-offset-white scale-110 shadow-md'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={colorName}
                  />
                );
              })}
            </div>
            {errors.color && (
              <p className="text-xs text-danger font-medium">{errors.color.message}</p>
            )}
          </div>

          {/* Icon Picker Grid */}
          <div className="space-y-2 flex flex-col min-h-0">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]">
              Select Icon
            </label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl overflow-y-auto max-h-[220px]">
              {CURATED_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                const activeColor = getCategoryColorClasses(selectedColor);

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setValue('icon', iconName)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? `${activeColor.fill} text-white shadow-md`
                        : 'bg-white border border-[#EAEAEA] text-[#707070] hover:text-[#111111] hover:bg-[#F7F7F7]'
                    }`}
                    title={iconName}
                  >
                    <CategoryIcon name={iconName} size={18} />
                  </button>
                );
              })}
            </div>
            {errors.icon && (
              <p className="text-xs text-danger font-medium">{errors.icon.message}</p>
            )}
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#EAEAEA] bg-[#F7F7F7] flex gap-3 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg font-semibold text-sm text-[#707070] transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            className="px-5 py-2 bg-black hover:bg-black/90 rounded-lg font-semibold text-sm text-white flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Saving...
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Category'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
