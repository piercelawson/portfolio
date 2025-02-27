
document.addEventListener('DOMContentLoaded', () => {
    const galleryCards = document.querySelectorAll('.gallery-card');
    const header = document.querySelector('header');
    const hero = document.querySelector('#hero');
    const footer = document.querySelector('footer');
    const spinningCircle = document.querySelector('.spinning-circle');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let currentPlaying = null;
    let overlayTimeout = null;
    let lastScrollY = window.scrollY;
    let rotation = 0;
    let velocity = 0;
    let isAnimating = false;
    const playedVideos = new Set();
    
    console.log("Gallery cards found:", galleryCards.length);
    console.log("Is mobile:", isMobile);
    
    // Set poster attribute to show first frame for all videos
    galleryCards.forEach(card => {
        const video = card.querySelector('video');
        if (video && !video.hasAttribute('poster')) {
            // If no poster was specified, use "auto" to display first frame
            video.setAttribute('poster', 'auto');
        }
    });

    // Function to check if an element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= -rect.height/2 &&
            rect.top <= window.innerHeight - rect.height/2
        );
    }
    
    // Better viewport detection for smoother mobile experience
    function isInViewportBetter(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Get center point of viewport
        const viewportCenter = windowHeight / 2;
        
        // Get center point of element
        const elementCenter = rect.top + (rect.height / 2);
        
        // Calculate how close the element's center is to the viewport's center
        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
        
        // Element is considered "centered" if its center is within 20% of the viewport's center
        const threshold = windowHeight * 0.2;
        
        return distanceFromCenter < threshold;
    }
    
    // Preload all videos to prevent stuttering on mobile
    function preloadVideos() {
        galleryCards.forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                // Set low-priority loading
                video.preload = "metadata";
                
                // Attempt to preload a bit of the video
                setTimeout(() => {
                    video.load();
                }, 500);
            }
        });
    }
    
    // Call preload on page load
    preloadVideos();

    // Hide overlay with delay
    function hideOverlayWithDelay(card, delay = 0) {
        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;
        
        clearTimeout(overlayTimeout);
        
        if (delay) {
            overlayTimeout = setTimeout(() => {
                overlay.classList.add('hidden');
            }, delay);
        } else {
            overlay.classList.add('hidden');
        }
    }

    // Show overlay
    function showOverlay(card) {
        if (!card) return;
        
        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;
        
        clearTimeout(overlayTimeout);
        overlay.classList.remove('hidden');
    }
    
    // Cleanup when leaving page
    window.addEventListener('beforeunload', () => {
        if (currentPlaying) {
            currentPlaying.pause();
            currentPlaying = null;
        }
    });

    // Handle video playback with optimizations
    function handleVideoPlayback(card, shouldPlay) {
        const video = card.querySelector('video');
        if (!video) {
            return;
        }
        
        // Prevent constant start/stop cycles
        if (shouldPlay && (video.paused || video.ended)) {
            // If another video is playing, pause it first
            if (currentPlaying && currentPlaying !== video) {
                const previousCard = currentPlaying.closest('.gallery-card');
                currentPlaying.pause();
                showOverlay(previousCard);
                previousCard.classList.remove('playing');
            }
            
            if (!playedVideos.has(video)) {
                playedVideos.add(video);
                // Make sure video is properly loaded
                video.load();
            }
            
            // Use a silent catch to prevent console errors on mobile autoplay restrictions
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    card.classList.add('playing');
                    
                    // Hide overlay with delay for better user experience
                    hideOverlayWithDelay(card, 800);
                    currentPlaying = video;
                }).catch(error => {
                    console.log("Playback prevented:", error);
                    showOverlay(card);
                });
            }
        } else if (!shouldPlay && !video.paused) {
            video.pause();
            card.classList.remove('playing');
            card.classList.remove('playing');
            showOverlay(card);
        }
    }

    // Desktop hover behavior
    if (!isMobile) {
        galleryCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                handleVideoPlayback(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                handleVideoPlayback(card, false);
            });
        });
    }
    
    // Mobile scroll behavior with debounce
    if (isMobile) {
        let scrollTimeout;
        let lastCheckTime = 0;
        let isScrolling = false;
        const THROTTLE_DELAY = 400; // Only check every 400ms to avoid rapid start/stop
        
        function checkVideoVisibility() {
            // Don't check too frequently
            const now = Date.now();
            if (now - lastCheckTime < THROTTLE_DELAY) return;
            lastCheckTime = now;
            
            // Stop all videos while scrolling to prevent stuttering
            if (isScrolling) {
                galleryCards.forEach(card => {
                    const video = card.querySelector('video');
                    if (video && !video.paused) {
                        video.pause();
                        showOverlay(card);
                    }
                });
                return;
            }
            
            // Only play one video at a time - the most centered one
            let bestCard = null;
            let bestDistance = Infinity;
            
            galleryCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const elementCenter = rect.top + (rect.height / 2);
                const viewportCenter = windowHeight / 2;
                const distance = Math.abs(elementCenter - viewportCenter);
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCard = card;
                }
                
                // Pause all videos initially
                handleVideoPlayback(card, false);
            });
            
            // Only play the most centered video if it's actually in viewport
            if (bestCard && isInViewportBetter(bestCard)) {
                handleVideoPlayback(bestCard, true);
            }
        }
        
        // Initial check on page load with a slight delay to allow videos to load
        setTimeout(() => {
            checkVideoVisibility();
        }, 500);
        
        // Track scroll state
        window.addEventListener('scroll', () => {
            isScrolling = true;
            clearTimeout(scrollTimeout);
            
            // After scrolling stops, wait a bit before checking visibility
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                checkVideoVisibility();
            }, 300);
        });
        
        // Check videos on page load
        window.addEventListener('load', () => {
                checkVideoVisibility();
            }, 100); // Short delay to debounce rapid scrolling
        });
    }

    // Header scroll behavior
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        lastScrollY = currentScrollY;
    });

    // Spinning Circle Animation and Behavior
    if (spinningCircle) {
        const spinningGroup = spinningCircle.querySelector('.spinning-group');

        // Animation loop with slower easing
        const animate = () => {
            if (Math.abs(velocity) > 0.1 || isAnimating) {
                rotation += velocity;
                spinningGroup.style.transform = `rotate(${rotation}deg)`;
                velocity *= 0.8; // Slower decay for longer, gentler coasting
                requestAnimationFrame(animate);
            } else {
                isAnimating = false;
            }
        };

        // Interaction
        spinningCircle.addEventListener('click', () => {
            velocity = 8; // Faster spin on click
            if (!isAnimating) {
                isAnimating = true;
                animate();
            }
        });

        // Auto-start animation
        velocity = 2; // Initial gentle rotation
        isAnimating = true;
        animate();
    }
});
