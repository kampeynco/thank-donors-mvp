// Key fixes for image loading issues:

// 1. Fix the useEffect order - reset localImage BEFORE syncing dbImage
useEffect(() => {
    const incomingImage = template?.frontpsc_background_image;
    const incomingMessage = template?.backpsc_message_template;

    // Reset local state first
    setLocalImage(null);
    setUploadedUrl(null);
    setImageLoadError(false);
    setRetryCount(0);

    const syncImage = async () => {
        if (!incomingImage) {
            setDbImage(null);
            return;
        }

        if (incomingImage.startsWith('http') || incomingImage.startsWith('data:')) {
            setDbImage(incomingImage);
        }

        const freshUrl = await getFreshSignedUrl(incomingImage);
        if (freshUrl) {
            setDbImage(freshUrl);
            setImageLoadError(false);
        } else if (!incomingImage.startsWith('http')) {
            setImageLoadError(true);
        }
    };

    syncImage();

    if (incomingMessage && incomingMessage !== message) {
        setMessage(incomingMessage);
    }
}, [template?.frontpsc_background_image, template?.backpsc_message_template, currentAccount?.id]);

// 2. Fix handleImageError to use functional state updates
const handleImageError = async () => {
    setImageLoadError(false); // Reset first

    setRetryCount(prev => {
        if (prev >= 2) {
            setImageLoadError(true);
            return prev;
        }

        // Attempt refresh
        (async () => {
            const currentImage = localImage || uploadedUrl || dbImage;

            if (!currentImage || currentImage.startsWith('data:') || currentImage.startsWith('blob:')) {
                setImageLoadError(true);
                return;
            }

            const freshUrl = await getFreshSignedUrl(currentImage);

            if (freshUrl && freshUrl !== currentImage) {
                // Update the appropriate state
                if (currentImage === dbImage) {
                    setDbImage(freshUrl);
                } else if (currentImage === uploadedUrl) {
                    setUploadedUrl(freshUrl);
                } else if (currentImage === localImage) {
                    setLocalImage(freshUrl);
                }
                setImageLoadError(false);
            } else {
                setImageLoadError(true);
            }
        })();

        return prev + 1;
    });
};

// 3. Add a separate effect to clear error when image changes
useEffect(() => {
    if (activeImage) {
        setImageLoadError(false);
        setRetryCount(0);
    }
}, [activeImage]);

// 4. Improve the image display component with better error handling
{
    viewSide === 'front' ? (
        <div className="w-full h-full relative group">
            {activeImage && !imageLoadError ? (
                <img
                    key={activeImage} // Use full URL as key, not with retryCount
                    src={activeImage}
                    onError={handleImageError}
                    onLoad={() => {
                        setImageLoadError(false);
                        setRetryCount(0);
                    }}
                    alt="Postcard Front"
                    className="w-full h-full object-cover bg-stone-100"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-sm">
                    <ImageIcon size={48} className="text-stone-200 mb-4" />
                    <p className="text-stone-400 font-medium">
                        {imageLoadError ? 'Failed to load image' : 'No front image uploaded'}
                    </p>
                    {imageLoadError && (
                        <button
                            onClick={() => {
                                setImageLoadError(false);
                                setRetryCount(0);
                                // Force re-render by creating a new signed URL
                                (async () => {
                                    const currentImage = localImage || uploadedUrl || dbImage;
                                    if (currentImage) {
                                        const freshUrl = await getFreshSignedUrl(currentImage);
                                        if (freshUrl) {
                                            if (currentImage === dbImage) setDbImage(freshUrl);
                                            else if (currentImage === uploadedUrl) setUploadedUrl(freshUrl);
                                        }
                                    }
                                })();
                            }}
                            className="mt-4 text-xs bg-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-300 transition-colors font-bold text-stone-600"
                        >
                            Retry Loading
                        </button>
                    )}
                </div>
            )}
            <div className="absolute inset-0 border-8 border-white/10 pointer-events-none"></div>
        </div>
    ) : (
    // Back side content...
)
}

// 5. Optional: Add image preloading for history images
const fetchImageHistory = async () => {
    const entityId = currentAccount?.entity_id;
    const storagePath = entityId ? `entity_${entityId}` : 'default';
    if (!storagePath) return;

    try {
        const { data, error } = await supabase.storage
            .from('images')
            .list(storagePath, {
                limit: 8,
                sortBy: { column: 'updated_at', order: 'desc' }
            });

        if (!error && data) {
            const validFiles = data.filter(f => f.name !== '.emptyFolderPlaceholder');
            const urls = await Promise.all(validFiles.map(async f => {
                const { data: signedData } = await supabase.storage
                    .from('images')
                    .createSignedUrl(`${storagePath}/${f.name}`, 60 * 60 * 24 * 365);
                return signedData?.signedUrl;
            }));

            const validUrls = urls.filter(u => u) as string[];
            setImageHistory(validUrls);

            // Preload first image
            if (validUrls.length > 0 && !template?.frontpsc_background_image && !localImage && !uploadedUrl) {
                const img = new Image();
                img.onload = () => setUploadedUrl(validUrls[0]);
                img.onerror = () => console.error('Failed to preload image');
                img.src = validUrls[0];
            }
        }
    } catch (e) {
        console.error("Error fetching history:", e);
    }
};

// 6. Add defensive check in getFreshSignedUrl
const getFreshSignedUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('blob:')) return null;

    try {
        let bucket = 'images';
        let key = '';

        if (url.includes('/storage/v1/object/')) {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/object/');
            if (parts.length < 2) return url;

            const pathSegments = parts[1].split('/').filter(Boolean);
            if (pathSegments.length < 2) return url;

            const modes = ['public', 'authenticated', 'sign'];
            if (modes.includes(pathSegments[0]) && pathSegments.length >= 3) {
                bucket = pathSegments[1];
                key = decodeURIComponent(pathSegments.slice(2).join('/'));
            } else {
                bucket = pathSegments[0];
                key = decodeURIComponent(pathSegments.slice(1).join('/'));
            }
        } else if (!url.startsWith('http')) {
            key = url;
        } else {
            return url;
        }

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const signedUrlPromise = supabase.storage
            .from(bucket)
            .createSignedUrl(key, 60 * 60 * 24 * 365);

        const { data, error } = await Promise.race([
            signedUrlPromise,
            timeoutPromise
        ]) as any;

        if (error || !data?.signedUrl) {
            const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(key);
            return publicData.publicUrl;
        }

        return data.signedUrl;
    } catch (e) {
        console.error('Error getting fresh signed URL:', e);
        return url; // Return original URL as fallback
    }
};