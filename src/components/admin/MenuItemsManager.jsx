import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, X, Upload,
  Image as ImageIcon, Star, Heart, ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import LuxuryButton from '../common/LuxuryButton';
import { toast } from 'sonner';
import { useNotifications } from '@/components/notifications/NotificationManager';

const PAGE_SIZE = 12;

export default function MenuItemsManager({ hotelId }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    full_description: '',
    price: '',
    category: '',
    image_url: '',
    gallery_images: [],
    ingredients: [],
    spices: [],
    companions: [],
    dietary_tags: [],
    is_featured: false,
    stock_count: 100,
    low_stock_threshold: 10
  });

  const [ingredientInput, setIngredientInput] = useState('');
  const [spiceInput, setSpiceInput] = useState('');
  const [companionInput, setCompanionInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);

  const queryClient = useQueryClient();
  const { sendNotification } = useNotifications();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1); }, [categoryFilter]);

  const skip = (currentPage - 1) * PAGE_SIZE;

  const buildFilter = useCallback(() => {
    const filter = {};
    if (hotelId) filter.hotel_id = hotelId;
    if (categoryFilter !== 'all') filter.category = categoryFilter;
    return filter;
  }, [hotelId, categoryFilter]);

  const { data: pageResult = { items: [], total: 0 }, isLoading, isFetching } = useQuery({
    queryKey: ['admin-menu-items', hotelId, categoryFilter, debouncedSearch, currentPage],
    queryFn: async () => {
      const filter = buildFilter();
      // If searching, fetch a larger set server-side and filter locally (API doesn't support text search)
      if (debouncedSearch) {
        const all = Object.keys(filter).length
          ? await base44.entities.MenuItem.filter(filter, '-created_date', 500)
          : await base44.entities.MenuItem.list('-created_date', 500);
        const q = debouncedSearch.toLowerCase();
        const filtered = all.filter(item =>
          item.name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
        const start = skip;
        return { items: filtered.slice(start, start + PAGE_SIZE), total: filtered.length };
      }
      // Normal paginated fetch
      const items = Object.keys(filter).length
        ? await base44.entities.MenuItem.filter(filter, '-created_date', PAGE_SIZE, skip)
        : await base44.entities.MenuItem.list('-created_date', PAGE_SIZE, skip);
      // Fetch total count with a lightweight call
      const allForCount = Object.keys(filter).length
        ? await base44.entities.MenuItem.filter(filter, '-created_date', 1000)
        : await base44.entities.MenuItem.list('-created_date', 1000);
      return { items, total: allForCount.length };
    },
    keepPreviousData: true,
  });

  const menuItems = pageResult.items;
  const totalItems = pageResult.total;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-menu-items']);
      queryClient.invalidateQueries(['menu-items']);
      queryClient.invalidateQueries(['featured-menu']);
      toast.success('Menu item created successfully');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-menu-items']);
      queryClient.invalidateQueries(['menu-items']);
      queryClient.invalidateQueries(['featured-menu']);
      toast.success('Menu item updated successfully');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-menu-items']);
      queryClient.invalidateQueries(['menu-items']);
      queryClient.invalidateQueries(['featured-menu']);
      toast.success('Menu item deleted successfully');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      ...(hotelId ? { hotel_id: hotelId } : {}),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      full_description: item.full_description || '',
      price: item.price || '',
      category: item.category || '',
      image_url: item.image_url || '',
      gallery_images: item.gallery_images || [],
      ingredients: item.ingredients || [],
      spices: item.spices || [],
      companions: item.companions || [],
      dietary_tags: item.dietary_tags || [],
      is_featured: item.is_featured || false,
      stock_count: item.stock_count || 100,
      low_stock_threshold: item.low_stock_threshold || 10
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      full_description: '',
      price: '',
      category: '',
      image_url: '',
      gallery_images: [],
      ingredients: [],
      spices: [],
      companions: [],
      dietary_tags: [],
      is_featured: false,
      stock_count: 100,
      low_stock_threshold: 10
    });
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, image_url: file_url });
    setIsUploading(false);
    toast.success('Image uploaded');
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsGalleryUploading(true);
    const uploadPromises = files.map(file => 
      base44.integrations.Core.UploadFile({ file })
    );
    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.file_url);
    
    setFormData({ 
      ...formData, 
      gallery_images: [...formData.gallery_images, ...urls] 
    });
    setIsGalleryUploading(false);
    toast.success(`${urls.length} image(s) added to gallery`);
  };

  const removeGalleryImage = (index) => {
    setFormData({
      ...formData,
      gallery_images: formData.gallery_images.filter((_, i) => i !== index)
    });
  };

  const addItem = (type, input, setInput) => {
    if (input.trim()) {
      setFormData({
        ...formData,
        [type]: [...formData[type], input.trim()]
      });
      setInput('');
    }
  };

  const removeItem = (type, index) => {
    setFormData({
      ...formData,
      [type]: formData[type].filter((_, i) => i !== index)
    });
  };

  const toggleDietary = (tag) => {
    if (formData.dietary_tags.includes(tag)) {
      setFormData({ ...formData, dietary_tags: formData.dietary_tags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, dietary_tags: [...formData.dietary_tags, tag] });
    }
  };

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher', 'Keto', 'Paleo'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#1a1a1a] border-[#c9a962]/20 text-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-[#c9a962]/20 text-white rounded-lg px-3 py-2 font-inter text-sm"
          >
            <option value="all">All Categories</option>
            <option value="starters">Starters</option>
            <option value="main_dishes">Main Dishes</option>
            <option value="desserts">Desserts</option>
            <option value="drinks">Drinks</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-inter text-xs text-white/40 whitespace-nowrap">
            {totalItems} items
          </span>
          <LuxuryButton onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </LuxuryButton>
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          {menuItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all"
            >
              <div className="relative h-48">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {item.is_featured && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-[#c9a962] flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#0a0a0a] fill-[#0a0a0a]" />
                    <span className="text-xs font-inter text-[#0a0a0a] font-medium">Featured</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-[#0a0a0a]/60 backdrop-blur-sm flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#c9a962]" />
                  <span className="text-xs font-inter text-white">{item.likes_count || 0}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-playfair text-lg text-white">{item.name}</h3>
                  <span className="font-playfair text-[#c9a962] font-semibold">
                    ${item.price?.toFixed(2)}
                  </span>
                </div>
                <p className="font-inter text-xs text-white/50 mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded-full text-xs font-inter bg-[#c9a962]/20 text-[#c9a962] capitalize">
                    {item.category?.replace('_', ' ')}
                  </span>
                  {item.dietary_tags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-2 py-1 rounded-full text-xs font-inter bg-green-500/20 text-green-300">
                      {tag}
                    </span>
                  ))}
                  {item.dietary_tags?.length > 2 && (
                    <span className="px-2 py-1 rounded-full text-xs font-inter bg-[#0a0a0a] text-white/50">
                      +{item.dietary_tags.length - 2}
                    </span>
                  )}
                </div>
                {(item.ingredients?.length > 0 || item.spices?.length > 0) && (
                  <p className="font-inter text-xs text-white/40 mb-3">
                    {item.ingredients?.slice(0, 3).join(', ')}
                    {item.ingredients?.length > 3 ? '...' : ''}
                  </p>
                )}
                <div className="flex gap-2">
                  <LuxuryButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </LuxuryButton>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-2 rounded-full bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#c9a962]/10">
          <span className="font-inter text-xs text-white/40">
            Page {currentPage} of {totalPages} &mdash; showing {Math.min(skip + 1, totalItems)}–{Math.min(skip + PAGE_SIZE, totalItems)} of {totalItems}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#c9a962]/20 text-white/60 hover:text-[#c9a962] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = startPage + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-inter text-sm transition-all ${
                    page === currentPage
                      ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold'
                      : 'bg-[#1a1a1a] border border-[#c9a962]/20 text-white/60 hover:text-[#c9a962]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#c9a962]/20 text-white/60 hover:text-[#c9a962] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#c9a962]/10 p-6 flex items-center justify-between z-10">
                <h2 className="font-playfair text-2xl text-white">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>
                <button onClick={resetForm} className="text-white/50 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                      Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                      Price *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Category *
                  </label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#c9a962]/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#c9a962]/20">
                      <SelectItem value="starters">Starters</SelectItem>
                      <SelectItem value="main_dishes">Main Dishes</SelectItem>
                      <SelectItem value="desserts">Desserts</SelectItem>
                      <SelectItem value="drinks">Drinks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Short Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                  />
                </div>

                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Full Description
                  </label>
                  <Textarea
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    rows={4}
                    className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Main Image
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#c9a962]/30 hover:border-[#c9a962]/60">
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-[#c9a962]/60" />
                        )}
                        <span className="font-inter text-sm text-white/50">
                          {formData.image_url ? 'Change image' : 'Upload image'}
                        </span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                    )}
                  </div>
                </div>

                {/* Gallery Images */}
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Gallery Images
                  </label>
                  <label className="cursor-pointer block mb-3">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#c9a962]/30 hover:border-[#c9a962]/60">
                      {isGalleryUploading ? (
                        <div className="w-5 h-5 border-2 border-[#c9a962]/20 border-t-[#c9a962] rounded-full animate-spin" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#c9a962]/60" />
                      )}
                      <span className="font-inter text-sm text-white/50">
                        Add gallery images
                      </span>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                  </label>
                  {formData.gallery_images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {formData.gallery_images.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-20 rounded-lg object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(i)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Ingredients
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('ingredients', ingredientInput, setIngredientInput))}
                      placeholder="Add ingredient"
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                    />
                    <LuxuryButton type="button" onClick={() => addItem('ingredients', ingredientInput, setIngredientInput)} size="sm">
                      <Plus className="w-4 h-4" />
                    </LuxuryButton>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-[#0a0a0a] text-white border border-[#c9a962]/20 flex items-center gap-2">
                        {ing}
                        <button type="button" onClick={() => removeItem('ingredients', i)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Spices */}
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Spices
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={spiceInput}
                      onChange={(e) => setSpiceInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('spices', spiceInput, setSpiceInput))}
                      placeholder="Add spice"
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                    />
                    <LuxuryButton type="button" onClick={() => addItem('spices', spiceInput, setSpiceInput)} size="sm">
                      <Plus className="w-4 h-4" />
                    </LuxuryButton>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.spices.map((spice, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/30 flex items-center gap-2">
                        {spice}
                        <button type="button" onClick={() => removeItem('spices', i)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Companions */}
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                    Suggested Companions
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={companionInput}
                      onChange={(e) => setCompanionInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('companions', companionInput, setCompanionInput))}
                      placeholder="Add companion"
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                    />
                    <LuxuryButton type="button" onClick={() => addItem('companions', companionInput, setCompanionInput)} size="sm">
                      <Plus className="w-4 h-4" />
                    </LuxuryButton>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.companions.map((comp, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-sm font-inter bg-[#0a0a0a] text-white/70 border border-[#c9a962]/20 flex items-center gap-2">
                        {comp}
                        <button type="button" onClick={() => removeItem('companions', i)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dietary Tags */}
                <div>
                  <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-3">
                    Dietary Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDietary(tag)}
                        className={`px-4 py-2 rounded-full font-inter text-sm transition-all ${
                          formData.dietary_tags.includes(tag)
                            ? 'bg-[#c9a962] text-[#0a0a0a]'
                            : 'bg-[#0a0a0a] text-white/60 border border-[#c9a962]/20'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                      Stock Count
                    </label>
                    <Input
                      type="number"
                      value={formData.stock_count}
                      onChange={(e) => setFormData({ ...formData, stock_count: parseInt(e.target.value) || 0 })}
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-[#c9a962] uppercase tracking-wider mb-2">
                      Low Stock Threshold
                    </label>
                    <Input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 10 })}
                      className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
                    />
                  </div>
                </div>

                {/* Featured */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    className="border-[#c9a962]/30"
                  />
                  <label className="font-inter text-sm text-white">
                    Feature this item on homepage
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#c9a962]/10">
                  <LuxuryButton type="button" variant="ghost" onClick={resetForm} className="flex-1">
                    Cancel
                  </LuxuryButton>
                  <LuxuryButton 
                    type="submit" 
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingItem ? 'Update' : 'Create'} Item
                  </LuxuryButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}