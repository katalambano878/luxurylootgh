'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ProductFormProps {
    initialData?: any;
    isEditMode?: boolean;
}

// Robust slug generator: strips accents, lowercases, collapses non-alphanumerics into single dashes.
function slugify(text: string): string {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

// Find the next available slug by checking the DB. Appends -2, -3, ... if needed.
async function findAvailableSlug(base: string, excludeId?: string): Promise<string> {
    const safeBase = slugify(base) || `product-${Date.now()}`;
    let candidate = safeBase;
    let counter = 2;
    // Hard stop after 50 tries to avoid infinite loops.
    for (let i = 0; i < 50; i++) {
        let query = supabase.from('products').select('id').eq('slug', candidate);
        if (excludeId) query = query.neq('id', excludeId);
        const { data, error } = await query.limit(1);
        if (error) {
            // If lookup fails, return candidate and let the DB constraint fall back.
            return candidate;
        }
        if (!data || data.length === 0) return candidate;
        candidate = `${safeBase}-${counter}`;
        counter++;
    }
    // Final fallback: append a timestamp.
    return `${safeBase}-${Date.now().toString(36).slice(-4)}`;
}

export default function ProductForm({ initialData, isEditMode = false }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [productName, setProductName] = useState(initialData?.name || '');
    const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
    const [price, setPrice] = useState(initialData?.price || '');
    const [salePrice, setSalePrice] = useState(
        initialData?.sale_price != null && initialData?.sale_price !== ''
            ? String(initialData.sale_price)
            : ''
    );
    const [comparePrice, setComparePrice] = useState(initialData?.compare_at_price || '');
    const [sku, setSku] = useState(initialData?.sku || '');
    const [stock, setStock] = useState(initialData?.quantity || '');
    const [moq, setMoq] = useState(initialData?.moq || '1');
    const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.metadata?.low_stock_threshold || '5');
    const [description, setDescription] = useState(initialData?.description || '');
    const [status, setStatus] = useState(initialData?.status || 'Active');
    const [featured, setFeatured] = useState(initialData?.featured || false);
    const [preorderShipping, setPreorderShipping] = useState(initialData?.metadata?.preorder_shipping || '');
    const [activeTab, setActiveTab] = useState('general');

    // Auto-generate SKU function
    const generateSku = () => {
        const prefix = 'SKU'; // REPLACE: update this prefix to match your brand
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    };

    // --- Variant System ---
    // Preset color palette
    const colorPresets = [
        { name: 'Black', hex: '#000000' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Red', hex: '#EF4444' },
        { name: 'Blue', hex: '#3B82F6' },
        { name: 'Navy', hex: '#1E3A5F' },
        { name: 'Green', hex: '#22C55E' },
        { name: 'Yellow', hex: '#EAB308' },
        { name: 'Pink', hex: '#EC4899' },
        { name: 'Purple', hex: '#A855F7' },
        { name: 'Orange', hex: '#F97316' },
        { name: 'Gray', hex: '#6B7280' },
        { name: 'Brown', hex: '#92400E' },
        { name: 'Beige', hex: '#D2B48C' },
        { name: 'Maroon', hex: '#800000' },
        { name: 'Teal', hex: '#14B8A6' },
        { name: 'Cream', hex: '#FFFDD0' },
        { name: 'Gold', hex: '#D4AF37' },
        { name: 'Silver', hex: '#C0C0C0' },
    ];
    const sizePresets = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

    // Parse existing variants to extract unique colors and sizes
    const existingVariants = (initialData?.product_variants || []).map((v: any) => ({
        ...v,
        stock: v.stock ?? v.quantity ?? 0,
        color: v.color ?? v.option2 ?? '',
        size: v.name || ''
    }));

    const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>(() => {
        const colors = new Map<string, string>();
        existingVariants.forEach((v: any) => {
            if (v.color) {
                const preset = colorPresets.find(c => c.name.toLowerCase() === v.color.toLowerCase());
                colors.set(v.color, preset?.hex || '#888888');
            }
        });
        return Array.from(colors.entries()).map(([name, hex]) => ({ name, hex }));
    });

    const [selectedSizes, setSelectedSizes] = useState<string[]>(() => {
        const sizes = new Set<string>();
        existingVariants.forEach((v: any) => {
            if (v.size) sizes.add(v.size);
        });
        return Array.from(sizes);
    });

    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#888888');
    const [customSize, setCustomSize] = useState('');

    // Build variants from colors × sizes (or just sizes, or just colors)
    const buildVariantKey = (color: string, size: string) => `${color}|||${size}`;

    // Store variant data (price, stock) in a map keyed by "color|||size"
    const emptyVariantRow = () => ({
        price: price,
        stock: '0',
        sku: '',
        salePrice: '',
    });

    const [variantData, setVariantData] = useState<
        Record<string, { price: string; stock: string; sku: string; salePrice: string }>
    >(() => {
        const data: Record<string, { price: string; stock: string; sku: string; salePrice: string }> = {};
        existingVariants.forEach((v: any) => {
            const key = buildVariantKey(v.color || '', v.size || '');
            data[key] = {
                price: v.price?.toString() || '',
                stock: v.stock?.toString() || '0',
                sku: v.sku || '',
                salePrice:
                    v.sale_price != null && v.sale_price !== ''
                        ? String(v.sale_price)
                        : '',
            };
        });
        return data;
    });

    // Computed: all variant combinations
    const variantCombinations = (() => {
        const combos: { color: string; colorHex: string; size: string; key: string }[] = [];
        const colors = selectedColors.length > 0 ? selectedColors : [{ name: '', hex: '' }];
        const sizes = selectedSizes.length > 0 ? selectedSizes : [''];

        for (const color of colors) {
            for (const size of sizes) {
                if (!color.name && !size) continue; // skip if both empty
                const key = buildVariantKey(color.name, size);
                combos.push({ color: color.name, colorHex: color.hex, size, key });
            }
        }
        return combos;
    })();

    // Build the flat variants array for saving (used by handleSubmit)
    const variants = variantCombinations.map(combo => {
        const d = variantData[combo.key] || emptyVariantRow();
        return {
            name: combo.size,
            color: combo.color,
            sku: d.sku,
            price: d.price || price,
            salePrice: d.salePrice,
            stock: d.stock || '0',
        };
    });

    const updateVariantField = (key: string, field: string, value: string) => {
        setVariantData(prev => ({
            ...prev,
            [key]: { ...prev[key] || emptyVariantRow(), [field]: value },
        }));
    };

    const bulkSetField = (field: 'price' | 'stock' | 'salePrice', value: string) => {
        setVariantData(prev => {
            const updated = { ...prev };
            variantCombinations.forEach(combo => {
                updated[combo.key] = {
                    ...updated[combo.key] || emptyVariantRow(),
                    [field]: value,
                };
            });
            return updated;
        });
    };

    const toggleColor = (color: { name: string; hex: string }) => {
        setSelectedColors(prev => {
            const exists = prev.find(c => c.name === color.name);
            if (exists) return prev.filter(c => c.name !== color.name);
            return [...prev, color];
        });
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev => {
            if (prev.includes(size)) return prev.filter(s => s !== size);
            return [...prev, size];
        });
    };

    const addCustomColor = () => {
        if (!customColorName.trim()) return;
        const exists = selectedColors.find(c => c.name.toLowerCase() === customColorName.trim().toLowerCase());
        if (!exists) {
            setSelectedColors(prev => [...prev, { name: customColorName.trim(), hex: customColorHex }]);
        }
        setCustomColorName('');
        setCustomColorHex('#888888');
    };

    const addCustomSize = () => {
        if (!customSize.trim()) return;
        if (!selectedSizes.includes(customSize.trim())) {
            setSelectedSizes(prev => [...prev, customSize.trim()]);
        }
        setCustomSize('');
    };

    // Images
    const [images, setImages] = useState<any[]>(initialData?.product_images || []);
    const [uploading, setUploading] = useState(false);

    // SEO
    const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
    const [metaDescription, setMetaDescription] = useState(initialData?.seo_description || '');
    const [urlSlug, setUrlSlug] = useState(initialData?.slug || '');
    const [keywordList, setKeywordList] = useState<string[]>(
        Array.isArray(initialData?.tags) ? initialData.tags.filter(Boolean) : []
    );
    const [keywordDraft, setKeywordDraft] = useState('');
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

    // Resolve the public store URL once for SEO previews. Falls back to a friendly default.
    const storeUrl = useMemo(() => {
        const raw = process.env.NEXT_PUBLIC_APP_URL || 'https://luxurylootgh.com';
        return raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }, []);

    // Effective values shown in the SERP preview — fall back to the product name/description when SEO fields are blank.
    const effectiveSeoTitle = (seoTitle || productName || 'Your product title').trim();
    const effectiveMetaDescription = (metaDescription || description || 'A great product from your store.').trim();

    // Helpers for the colored counters/progress bars.
    const titleLen = seoTitle.length;
    const descLen = metaDescription.length;
    const titleZone = titleLen === 0 ? 'gray' : titleLen < 30 ? 'amber' : titleLen <= 60 ? 'green' : 'red';
    const descZone = descLen === 0 ? 'gray' : descLen < 80 ? 'amber' : descLen <= 160 ? 'green' : 'red';
    const zoneText: Record<string, string> = {
        gray: 'text-gray-400', amber: 'text-amber-600', green: 'text-green-600', red: 'text-red-600',
    };
    const zoneBar: Record<string, string> = {
        gray: 'bg-gray-300', amber: 'bg-amber-500', green: 'bg-green-500', red: 'bg-red-500',
    };
    const zoneBg: Record<string, string> = {
        gray: 'bg-gray-50', amber: 'bg-amber-50', green: 'bg-green-50', red: 'bg-red-50',
    };

    const addKeyword = (raw: string) => {
        const cleaned = raw.trim().replace(/^,+|,+$/g, '').trim();
        if (!cleaned) return;
        if (keywordList.some(k => k.toLowerCase() === cleaned.toLowerCase())) {
            setKeywordDraft('');
            return;
        }
        setKeywordList(prev => [...prev, cleaned]);
        setKeywordDraft('');
    };
    const removeKeyword = (idx: number) => {
        setKeywordList(prev => prev.filter((_, i) => i !== idx));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: 'ri-information-line' },
        { id: 'pricing', label: 'Pricing & Inventory', icon: 'ri-price-tag-3-line' },
        { id: 'variants', label: 'Variants', icon: 'ri-layout-grid-line' },
        { id: 'images', label: 'Images', icon: 'ri-image-line' },
        { id: 'seo', label: 'SEO', icon: 'ri-search-line' }
    ];

    // Fetch categories on mount
    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase.from('categories').select('id, name').eq('status', 'active');
            if (data) {
                setCategories(data);
                if (data.length > 0 && !categoryId) {
                    setCategoryId(data[0].id);
                }
            }
        }
        fetchCategories();
    }, [categoryId]);

    // Auto-generate slug from name on first edit (only when slug is empty).
    useEffect(() => {
        if (!isEditMode && productName && !urlSlug) {
            setUrlSlug(slugify(productName));
        }
    }, [productName, isEditMode, urlSlug]);

    // Live availability check for the slug. Debounced so we don't hammer the DB.
    useEffect(() => {
        if (!urlSlug) {
            setSlugStatus('idle');
            return;
        }
        const cleaned = slugify(urlSlug);
        if (cleaned !== urlSlug) {
            // The user typed something we'll have to clean — flag it instead of querying.
            setSlugStatus('invalid');
            return;
        }
        // If the slug is the same as the existing product's slug in edit mode, it's trivially available.
        if (isEditMode && initialData?.slug && cleaned === initialData.slug) {
            setSlugStatus('available');
            return;
        }
        setSlugStatus('checking');
        const handle = setTimeout(async () => {
            let query = supabase.from('products').select('id').eq('slug', cleaned);
            if (isEditMode && initialData?.id) query = query.neq('id', initialData.id);
            const { data, error } = await query.limit(1);
            if (error) {
                setSlugStatus('idle');
                return;
            }
            setSlugStatus(data && data.length > 0 ? 'taken' : 'available');
        }, 400);
        return () => clearTimeout(handle);
    }, [urlSlug, isEditMode, initialData?.id, initialData?.slug]);

    // Auto-generate SKU for new products
    useEffect(() => {
        if (!isEditMode && !sku) {
            setSku(generateSku());
        }
    }, [isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setImages([...images, { url: publicUrl, position: images.length }]);

        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(images.filter((_, idx) => idx !== indexToRemove));
    };

    // Variant helpers removed — variants are now auto-generated from selectedColors × selectedSizes

    const handleSubmit = async () => {
        try {
            setLoading(true);

            if (!productName.trim()) {
                alert('Please enter a product name.');
                setLoading(false);
                return;
            }

            // If product has variants, auto-sync main stock = sum of variant stocks
            const hasVariants = variants.length > 0;
            const variantStockTotal = hasVariants
                ? variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
                : parseInt(stock) || 0;

            // Resolve the slug: prefer what the user typed, but always sanitize and uniquify
            // before insert so we never trip the products_slug_key constraint.
            const requestedSlug = slugify(urlSlug || productName);
            const finalSlug = await findAvailableSlug(
                requestedSlug,
                isEditMode ? initialData?.id : undefined
            );
            // If the slug was bumped (e.g. taken), reflect that in the field so the user sees what's saved.
            if (finalSlug !== urlSlug) setUrlSlug(finalSlug);

            const salePriceNum = salePrice.trim() ? parseFloat(salePrice) : NaN;
            const productData = {
                name: productName,
                slug: finalSlug,
                description,
                category_id: categoryId || null,
                price: parseFloat(price) || 0,
                sale_price:
                    !Number.isNaN(salePriceNum) && salePriceNum > 0 ? salePriceNum : null,
                compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
                sku: sku || generateSku(), // Auto-generate if empty
                quantity: hasVariants ? variantStockTotal : (parseInt(stock) || 0),
                moq: parseInt(moq) || 1,
                status: status.toLowerCase(),
                featured,
                seo_title: seoTitle.trim() || null,
                seo_description: metaDescription.trim() || null,
                tags: keywordList.map(k => k.trim()).filter(Boolean),
                metadata: {
                    low_stock_threshold: parseInt(lowStockThreshold) || 5,
                    preorder_shipping: preorderShipping.trim() || null
                }
            };

            let productId = initialData?.id;
            let error;

            if (isEditMode && productId) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productId);
                error = updateError;
            } else {
                // Create new
                const { data: newProduct, error: insertError } = await supabase
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();

                if (newProduct) productId = newProduct.id;
                error = insertError;
            }

            if (error) throw error;

            // Update Images
            if (productId) {
                // Strategy: We will just delete all old images/variants and recreate them for simplicity in this MVP.
                // In a clearer implementation, we would diff them.

                // 1. Images
                if (isEditMode) {
                    await supabase.from('product_images').delete().eq('product_id', productId);
                }
                if (images.length > 0) {
                    const imageInserts = images.map((img, idx) => ({
                        product_id: productId,
                        url: img.url,
                        position: idx,
                        alt_text: productName
                    }));
                    await supabase.from('product_images').insert(imageInserts);
                }

                // 2. Variants
                if (isEditMode) {
                    // Be careful not to delete ALL variants if we want to preserve IDs etc, 
                    // but for now, full replacement is safer to ensure sync.
                    // Note: This might break order-item references if they rely on variant_id hard constraints without cascading.
                    // Our Schema migration has ON DELETE SET NULL for order_items -> variant_id, so this is safe for now (but distinct from "archiving").
                    await supabase.from('product_variants').delete().eq('product_id', productId);
                }

                if (variants.length > 0) {
                    const variantInserts = variants.map(v => {
                        const colorHex = selectedColors.find(c => c.name === v.color)?.hex || null;
                        const vSale = v.salePrice?.trim() ? parseFloat(v.salePrice) : NaN;
                        return {
                            product_id: productId,
                            name: v.name || v.color || 'Default',
                            sku: v.sku || null,
                            price: parseFloat(v.price) || 0,
                            sale_price:
                                !Number.isNaN(vSale) && vSale > 0 ? vSale : null,
                            quantity: parseInt(v.stock) || 0,
                            option1: v.name || null,
                            option2: v.color?.trim() || null,
                            metadata: colorHex ? { color_hex: colorHex } : {}
                        };
                    });
                    const { error: varError } = await supabase.from('product_variants').insert(variantInserts);
                    if (varError) throw varError;
                }
            }

            alert(isEditMode ? 'Product updated successfully!' : 'Product created successfully!');
            router.push('/admin/products');

        } catch (err: any) {
            console.error('Error saving product:', err);
            const msg = String(err?.message || '');
            if (msg.includes('products_slug_key') || msg.includes('duplicate key')) {
                alert('That URL slug is already taken. Please change the slug in the SEO tab and try again.');
            } else {
                alert(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/admin/products"
                        className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    >
                        <i className="ri-arrow-left-line text-xl text-gray-700"></i>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Product' : 'Add New Product'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditMode ? 'Update product information and settings' : 'Create a new product for your catalog'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {isEditMode && (
                        <Link
                            href={`/product/${initialData?.slug || initialData?.id}`}
                            target="_blank"
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-semibold whitespace-nowrap cursor-pointer flex items-center"
                        >
                            <i className="ri-eye-line mr-2"></i>
                            Preview
                        </Link>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-6 py-3 bg-stone-700 hover:bg-stone-800 text-white rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <i className="ri-loader-4-line animate-spin mr-2"></i>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="ri-save-line mr-2"></i>
                                {isEditMode ? 'Save Changes' : 'Create Product'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 overflow-x-auto">
                    <div className="flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-4 font-semibold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${activeTab === tab.id
                                    ? 'border-stone-700 text-stone-700 bg-stone-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <i className={`${tab.icon} text-xl`}></i>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6 max-w-3xl">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    maxLength={500}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 resize-none"
                                    placeholder="Describe your product..."
                                />
                                <p className="text-sm text-gray-500 mt-2">{description.length}/500 characters</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full px-4 py-3 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 cursor-pointer"
                                    >
                                        {categories.length === 0 && <option value="">Loading categories...</option>}
                                        {categories.length > 0 && <option value="">Select a category</option>}
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-4 py-3 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 cursor-pointer"
                                    >
                                        <option>Active</option>
                                        <option>Draft</option>
                                        <option>Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={featured}
                                    onChange={(e) => setFeatured(e.target.checked)}
                                    className="w-5 h-5 text-stone-700 border-gray-300 rounded focus:ring-stone-500 cursor-pointer"
                                />
                                <label className="text-gray-900 font-medium">
                                    Feature this product on homepage
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Pre-order / Estimated Shipping
                                </label>
                                <input
                                    type="text"
                                    value={preorderShipping}
                                    onChange={(e) => setPreorderShipping(e.target.value)}
                                    placeholder="e.g., Ships in 14 days, Available March 15"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty if product ships immediately. Otherwise, enter estimated shipping time.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pricing' && (
                        <div className="space-y-6 max-w-3xl">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Regular price (GH₵) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">GH₵</span>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full pl-16 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Sale price (GH₵)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">GH₵</span>
                                        <input
                                            type="number"
                                            value={salePrice}
                                            onChange={(e) => setSalePrice(e.target.value)}
                                            className="w-full pl-16 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                            step="0.01"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Used only when <strong>Store-wide sale</strong> is ON in Admin → Sale pricing. Leave empty to keep regular price during sales.
                                    </p>
                                    <div className="mt-3">
                                        <Link
                                            href="/admin/sales"
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50"
                                        >
                                            <i className="ri-price-tag-2-line"></i>
                                            Open Sale Pricing Toggle
                                        </Link>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Compare at Price (GH₵)
                                    </label>
                                    <div className="relative max-w-md">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">GH₵</span>
                                        <input
                                            type="number"
                                            value={comparePrice}
                                            onChange={(e) => setComparePrice(e.target.value)}
                                            className="w-full pl-16 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">Optional “was” price when not in site-wide sale mode</p>
                                </div>
                            </div>

                            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
                                <p className="text-stone-900 font-semibold mb-1">Discount Calculation</p>
                                {price && comparePrice && parseFloat(comparePrice) > parseFloat(price) ? (
                                    <p className="text-stone-800">
                                        Savings: GH₵ {(parseFloat(comparePrice) - parseFloat(price)).toFixed(2)}
                                        <span className="ml-2">
                                            ({(((parseFloat(comparePrice) - parseFloat(price)) / parseFloat(comparePrice)) * 100).toFixed(0)}% off)
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-stone-800 text-sm">Enter a valid compare price higher than the price to see discount.</p>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory</h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            SKU (Auto-generated)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={sku}
                                                onChange={(e) => setSku(e.target.value)}
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 font-mono bg-gray-50"
                                                placeholder="Auto-generated"
                                                readOnly
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSku(generateSku())}
                                                className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-stone-500 hover:bg-stone-50 transition-colors cursor-pointer"
                                                title="Generate new SKU"
                                            >
                                                <i className="ri-refresh-line text-lg"></i>
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">SKU is auto-generated. Click refresh to generate a new one.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Stock Quantity *
                                        </label>
                                        {variants.length > 0 ? (
                                            <div>
                                                <input
                                                    type="number"
                                                    value={variants.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0)}
                                                    readOnly
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                                />
                                                <p className="text-sm text-amber-600 mt-1 flex items-center">
                                                    <i className="ri-information-line mr-1"></i>
                                                    Stock is managed per variant. Edit stock in the Variants tab.
                                                </p>
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                                placeholder="0"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Minimum Order Quantity (MOQ)
                                        </label>
                                        <input
                                            type="number"
                                            value={moq}
                                            onChange={(e) => setMoq(e.target.value)}
                                            min="1"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                            placeholder="1"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Minimum quantity customers must order</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Low Stock Threshold
                                        </label>
                                        <input
                                            type="number"
                                            value={lowStockThreshold}
                                            onChange={(e) => setLowStockThreshold(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Get notified when stock falls below this number</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Product Variants</h3>
                                <p className="text-gray-600 mt-1">Select colors and sizes below — variants are generated automatically</p>
                            </div>

                            {/* STEP 1: Colors */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center">
                                    <i className="ri-palette-line mr-2 text-lg text-stone-700"></i>
                                    Step 1: Select Colors
                                    {selectedColors.length > 0 && (
                                        <span className="ml-2 bg-stone-100 text-stone-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {selectedColors.length} selected
                                        </span>
                                    )}
                                </h4>
                                <p className="text-xs text-gray-500 mb-4">Click colors to add/remove. Skip if product has no color options.</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {colorPresets.map(color => {
                                        const isSelected = selectedColors.some(c => c.name === color.name);
                                        return (
                                            <button
                                                key={color.name}
                                                onClick={() => toggleColor(color)}
                                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${isSelected
                                                        ? 'border-stone-600 bg-stone-50 ring-1 ring-stone-600'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                title={color.name}
                                            >
                                                <span
                                                    className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                                                    style={{ backgroundColor: color.hex }}
                                                ></span>
                                                <span className={isSelected ? 'text-stone-800' : 'text-gray-700'}>{color.name}</span>
                                                {isSelected && <i className="ri-check-line text-stone-700"></i>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom color */}
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                                    <input
                                        type="color"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                                        title="Pick a custom color"
                                    />
                                    <input
                                        type="text"
                                        value={customColorName}
                                        onChange={(e) => setCustomColorName(e.target.value)}
                                        placeholder="Custom color name"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addCustomColor()}
                                    />
                                    <button
                                        onClick={addCustomColor}
                                        disabled={!customColorName.trim()}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Add Color
                                    </button>
                                </div>

                                {/* Selected colors summary */}
                                {selectedColors.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {selectedColors.map(color => (
                                            <span key={color.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
                                                <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }}></span>
                                                {color.name}
                                                <button onClick={() => toggleColor(color)} className="text-gray-400 hover:text-red-500 ml-1">
                                                    <i className="ri-close-line text-sm"></i>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: Sizes */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center">
                                    <i className="ri-ruler-line mr-2 text-lg text-stone-600"></i>
                                    Step 2: Select Sizes
                                    {selectedSizes.length > 0 && (
                                        <span className="ml-2 bg-stone-100 text-stone-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {selectedSizes.length} selected
                                        </span>
                                    )}
                                </h4>
                                <p className="text-xs text-gray-500 mb-4">Click sizes to add/remove. Use custom for volumes (100ml), weights, etc.</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {sizePresets.map(size => {
                                        const isSelected = selectedSizes.includes(size);
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => toggleSize(size)}
                                                className={`px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${isSelected
                                                        ? 'border-stone-600 bg-stone-50 text-stone-800 ring-1 ring-stone-600'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                                                    }`}
                                            >
                                                {size}
                                                {isSelected && <i className="ri-check-line ml-1.5 text-stone-600"></i>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom size */}
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                                    <input
                                        type="text"
                                        value={customSize}
                                        onChange={(e) => setCustomSize(e.target.value)}
                                        placeholder="Custom size (e.g. 100ml, One Size, 42)"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addCustomSize()}
                                    />
                                    <button
                                        onClick={addCustomSize}
                                        disabled={!customSize.trim()}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Add Size
                                    </button>
                                </div>

                                {/* Selected sizes summary */}
                                {selectedSizes.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {selectedSizes.map(size => (
                                            <span key={size} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm font-medium">
                                                {size}
                                                <button onClick={() => toggleSize(size)} className="text-gray-400 hover:text-red-500 ml-1">
                                                    <i className="ri-close-line text-sm"></i>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* STEP 3: Variant Grid */}
                            {variantCombinations.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center">
                                                <i className="ri-grid-line mr-2 text-lg text-purple-600"></i>
                                                Step 3: Set Price & Stock ({variantCombinations.length} variant{variantCombinations.length > 1 ? 's' : ''})
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const val = prompt('Set price for ALL variants:', price?.toString() || '0');
                                                    if (val !== null) bulkSetField('price', val);
                                                }}
                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Bulk Set Price
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const val = prompt('Set stock for ALL variants:', '0');
                                                    if (val !== null) bulkSetField('stock', val);
                                                }}
                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Bulk Set Stock
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const val = prompt('Set sale price for ALL variants (empty to clear):', '');
                                                    if (val !== null) bulkSetField('salePrice', val);
                                                }}
                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Bulk Sale Price
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    {selectedColors.length > 0 && (
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Color</th>
                                                    )}
                                                    {selectedSizes.length > 0 && (
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Size</th>
                                                    )}
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Price (GH₵)</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sale (GH₵)</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variantCombinations.map((combo) => {
                                                    const d = variantData[combo.key] || emptyVariantRow();
                                                    return (
                                                        <tr key={combo.key} className="border-b border-gray-100 hover:bg-gray-50">
                                                            {selectedColors.length > 0 && (
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                                                                            style={{ backgroundColor: combo.colorHex }}
                                                                        ></span>
                                                                        <span className="text-sm font-medium text-gray-900">{combo.color}</span>
                                                                    </div>
                                                                </td>
                                                            )}
                                                            {selectedSizes.length > 0 && (
                                                                <td className="py-3 px-4">
                                                                    <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded">
                                                                        {combo.size}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    value={d.price}
                                                                    onChange={(e) => updateVariantField(combo.key, 'price', e.target.value)}
                                                                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                                                                    step="0.01"
                                                                    placeholder={price?.toString() || '0'}
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    value={d.salePrice}
                                                                    onChange={(e) => updateVariantField(combo.key, 'salePrice', e.target.value)}
                                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                                                                    step="0.01"
                                                                    placeholder="—"
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    value={d.stock}
                                                                    onChange={(e) => updateVariantField(combo.key, 'stock', e.target.value)}
                                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-3 bg-stone-50 border-t border-stone-100">
                                        <p className="text-xs text-stone-800 flex items-center">
                                            <i className="ri-information-line mr-1.5"></i>
                                            Total stock across all variants: <strong className="ml-1">{variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {variantCombinations.length === 0 && (
                                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <i className="ri-palette-line text-4xl text-gray-300 mb-2 block"></i>
                                    <p className="font-medium">No variants configured</p>
                                    <p className="text-sm mt-1">Select colors and/or sizes above to create variant combinations.</p>
                                    <p className="text-xs mt-2 text-gray-400">You can add just colors, just sizes, or both for a full grid.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Product Images</h3>
                                <p className="text-gray-600">Add up to 10 images. First image will be the primary image.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((img: any, index: number) => (
                                    <div key={index} className="relative group">
                                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                                            <img src={img.url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                        {index === 0 && (
                                            <span className="absolute top-2 left-2 bg-stone-700 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                                Primary
                                            </span>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 rounded-xl">
                                            <a href={img.url} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                                <i className="ri-eye-line"></i>
                                            </a>
                                            <button
                                                onClick={() => handleRemoveImage(index)}
                                                className="w-9 h-9 flex items-center justify-center bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <label className={`aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-stone-700 hover:bg-stone-50 transition-colors flex flex-col items-center justify-center space-y-2 text-gray-600 hover:text-stone-700 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploading ? (
                                        <i className="ri-loader-4-line animate-spin text-3xl"></i>
                                    ) : (
                                        <i className="ri-upload-2-line text-3xl"></i>
                                    )}
                                    <span className="text-sm font-semibold">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <strong>Image Guidelines:</strong> Use high-quality images (min 1000x1000px), white or neutral backgrounds work best.
                                    Supported formats: JPG, PNG, WebP (max 5MB each).
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">SEO &amp; Search</h3>
                                <p className="text-gray-600">Control how this product appears on Google, social shares, and the URL bar.</p>
                            </div>

                            {/* Live Google SERP preview */}
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                    <i className="ri-google-fill text-blue-600"></i>
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Google Search Preview</span>
                                </div>
                                <div className="p-4">
                                    <div className="text-xs text-gray-600 truncate">
                                        {storeUrl} &rsaquo; product &rsaquo; {urlSlug || 'product-slug'}
                                    </div>
                                    <div className="text-lg text-blue-700 font-medium leading-snug mt-0.5 truncate">
                                        {effectiveSeoTitle}
                                    </div>
                                    <div className="text-sm text-gray-700 leading-snug mt-1 line-clamp-2">
                                        {effectiveMetaDescription}
                                    </div>
                                </div>
                            </div>

                            {/* Page Title */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-900">Page Title</label>
                                    <span className={`text-xs font-medium ${zoneText[titleZone]}`}>
                                        {titleLen} / 60
                                        {titleLen === 0 && ' — defaults to product name'}
                                        {titleLen > 0 && titleLen < 30 && ' — too short'}
                                        {titleLen >= 30 && titleLen <= 60 && ' — looks good'}
                                        {titleLen > 60 && ' — may get cut off'}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={seoTitle}
                                    onChange={(e) => setSeoTitle(e.target.value)}
                                    maxLength={120}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                    placeholder={productName || 'SEO-friendly title'}
                                />
                                <div className="h-1 bg-gray-100 rounded mt-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${zoneBar[titleZone]}`}
                                        style={{ width: `${Math.min((titleLen / 60) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Aim for 50–60 characters. Leave empty to use the product name.</p>
                            </div>

                            {/* Meta Description */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-900">Meta Description</label>
                                    <span className={`text-xs font-medium ${zoneText[descZone]}`}>
                                        {descLen} / 160
                                        {descLen === 0 && ' — defaults to product description'}
                                        {descLen > 0 && descLen < 80 && ' — too short'}
                                        {descLen >= 80 && descLen <= 160 && ' — looks good'}
                                        {descLen > 160 && ' — may get cut off'}
                                    </span>
                                </div>
                                <textarea
                                    rows={3}
                                    maxLength={320}
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 resize-none"
                                    placeholder={description ? description.slice(0, 160) : 'Short, compelling summary that shows up in search results.'}
                                />
                                <div className="h-1 bg-gray-100 rounded mt-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${zoneBar[descZone]}`}
                                        style={{ width: `${Math.min((descLen / 160) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Aim for 120–160 characters. Leave empty to use the product description.</p>
                            </div>

                            {/* URL Slug */}
                            <div>
                                <label className="text-sm font-semibold text-gray-900 block mb-2">URL Slug</label>
                                <div className="flex items-stretch min-w-0">
                                    <span className="text-gray-600 bg-gray-100 px-3 py-3 border-2 border-r-0 border-gray-300 rounded-l-lg whitespace-nowrap text-sm overflow-hidden text-ellipsis hidden sm:inline-flex items-center max-w-[55%]">
                                        {storeUrl}/product/
                                    </span>
                                    <input
                                        type="text"
                                        value={urlSlug}
                                        onChange={(e) => setUrlSlug(slugify(e.target.value))}
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        className="min-w-0 flex-1 px-4 py-3 border-2 border-gray-300 sm:rounded-none rounded-l-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                        placeholder="product-slug"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => productName && setUrlSlug(slugify(productName))}
                                        disabled={!productName}
                                        title="Regenerate slug from product name"
                                        className="px-3 py-3 border-2 border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:text-stone-700 transition-colors"
                                    >
                                        <i className="ri-refresh-line text-lg"></i>
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-xs min-h-[1.25rem]">
                                    {slugStatus === 'checking' && (
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <i className="ri-loader-4-line animate-spin"></i>
                                            Checking availability…
                                        </span>
                                    )}
                                    {slugStatus === 'available' && (
                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                            <i className="ri-check-line"></i>
                                            Available
                                        </span>
                                    )}
                                    {slugStatus === 'taken' && (
                                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                                            <i className="ri-error-warning-line"></i>
                                            Already used — we&apos;ll auto-append a number on save
                                        </span>
                                    )}
                                    {slugStatus === 'invalid' && (
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <i className="ri-information-line"></i>
                                            Will be cleaned up to &quot;{slugify(urlSlug) || '—'}&quot; on save
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and dashes only.</p>
                            </div>

                            {/* Keywords as chips */}
                            <div>
                                <label className="text-sm font-semibold text-gray-900 block mb-2">Keywords / Tags</label>
                                <div className="flex flex-wrap gap-2 p-2.5 border-2 border-gray-300 rounded-lg min-h-[3rem] bg-white focus-within:ring-2 focus-within:ring-stone-500 focus-within:border-stone-500">
                                    {keywordList.map((kw, idx) => (
                                        <span
                                            key={`${kw}-${idx}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-800 text-sm rounded-full font-medium"
                                        >
                                            {kw}
                                            <button
                                                type="button"
                                                onClick={() => removeKeyword(idx)}
                                                className="text-stone-400 hover:text-red-500 transition-colors"
                                                title="Remove"
                                            >
                                                <i className="ri-close-line"></i>
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={keywordDraft}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            // Add when comma is typed
                                            if (v.includes(',')) {
                                                const parts = v.split(',');
                                                parts.slice(0, -1).forEach(p => addKeyword(p));
                                                setKeywordDraft(parts[parts.length - 1] || '');
                                            } else {
                                                setKeywordDraft(v);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (keywordDraft.trim()) addKeyword(keywordDraft);
                                            } else if (e.key === 'Backspace' && !keywordDraft && keywordList.length) {
                                                removeKeyword(keywordList.length - 1);
                                            }
                                        }}
                                        onBlur={() => keywordDraft.trim() && addKeyword(keywordDraft)}
                                        placeholder={keywordList.length ? 'Add another…' : 'Type a keyword and press Enter'}
                                        className="flex-1 min-w-[10rem] outline-none text-sm bg-transparent"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Press Enter or comma to add. Click × to remove. Backspace clears the last tag.</p>
                            </div>

                            {/* SEO checklist */}
                            <div className={`rounded-xl border p-4 ${zoneBg[titleZone === 'green' && descZone === 'green' && urlSlug && keywordList.length > 0 ? 'green' : 'amber']}`}>
                                <p className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                                    <i className="ri-shield-check-line mr-2 text-stone-700"></i>
                                    SEO Checklist
                                </p>
                                <ul className="space-y-1.5 text-sm">
                                    <li className="flex items-center gap-2">
                                        <i className={`${seoTitle ? 'ri-checkbox-circle-fill text-green-600' : 'ri-close-circle-line text-gray-400'} text-base`}></i>
                                        <span className={seoTitle ? 'text-gray-700' : 'text-gray-500'}>Custom page title set</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className={`${metaDescription ? 'ri-checkbox-circle-fill text-green-600' : 'ri-close-circle-line text-gray-400'} text-base`}></i>
                                        <span className={metaDescription ? 'text-gray-700' : 'text-gray-500'}>Meta description set</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className={`${urlSlug ? 'ri-checkbox-circle-fill text-green-600' : 'ri-close-circle-line text-gray-400'} text-base`}></i>
                                        <span className={urlSlug ? 'text-gray-700' : 'text-gray-500'}>URL slug defined</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className={`${keywordList.length > 0 ? 'ri-checkbox-circle-fill text-green-600' : 'ri-close-circle-line text-gray-400'} text-base`}></i>
                                        <span className={keywordList.length > 0 ? 'text-gray-700' : 'text-gray-500'}>At least one keyword/tag</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className={`${images.length > 0 ? 'ri-checkbox-circle-fill text-green-600' : 'ri-close-circle-line text-gray-400'} text-base`}></i>
                                        <span className={images.length > 0 ? 'text-gray-700' : 'text-gray-500'}>At least one product image</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
