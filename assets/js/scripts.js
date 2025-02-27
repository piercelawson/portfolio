
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
        
        // Calculate visibility percentage (how much of the element is visible)
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visiblePercentage = visibleHeight / rect.height;
        
        // Element is considered in viewport if at least 40% visible
        return visiblePercentage >= 0.4;
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

    // Hide overlay with delay for mobile
    function hideOverlayWithDelay(card, delay = 0) {
        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;
        
        clearTimeout(overlayTimeout);
        
        if (delay) {
            overlayTimeout = setTimeout(() => {
                overlay.classList.add('hidden');
                console.log("Overlay hidden after 2s for:", card.querySelector('video')?.src);
            }, delay);
        } else {
            overlay.classList.add('hidden');
            console.log("Subsequent play, hiding overlay immediately for:", card.querySelector('video')?.src);
        }
    }

    // Show overlay
    function showOverlay(card) {
        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;
        
        clearTimeout(overlayTimeout);
        overlay.classList.remove('hidden');
        console.log("Overlay reset for card:", card);
    }

    // Handle video playback with optimizations
    function handleVideoPlayback(card, shouldPlay) {
        const video = card.querySelector('video');
        if (!video) {
            return;
        }
        
        // Prevent constant start/stop cycles
        // Only change state if the video isn't already in the desired state
        if (shouldPlay && (video.paused || video.ended)) {
            if (!playedVideos.has(video)) {
                playedVideos.add(video);
                
                // For first play, make sure video is properly loaded
                video.load();
            }
            
            // Use a silent catch to prevent console errors on mobile autoplay restrictions
            video.play().then(() => {
                card.classList.add('playing');
                
                // For mobile, hide overlay after 1.5s 
                // For desktop, hide immediately
                if (isMobile) {
                    hideOverlayWithDelay(card, 1500);
                } else {
                    hideOverlayWithDelay(card, 0);
                }
                
                if (currentPlaying && currentPlaying !== video) {
                    currentPlaying.pause();
                    showOverlay(currentPlaying.closest('.gallery-card'));
                }
                
                currentPlaying = video;
            }).catch(() => {});
            
        } else if (!shouldPlay && !video.paused) {
            video.pause();
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
        const THROTTLE_DELAY = 300; // Only check every 300ms to avoid rapid start/stop
        
        function checkVideoVisibility() {
            // Don't check too frequently
            const now = Date.now();
            if (now - lastCheckTime < THROTTLE_DELAY) return;
            lastCheckTime = now;
            
            galleryCards.forEach(card => {
                // More generous viewport check (75% visibility)
                if (isInViewportBetter(card)) {
                    handleVideoPlayback(card, true);
                } else {
                    handleVideoPlayback(card, false);
                }
            });
        }
        
        // Initial check on page load with a slight delay to allow videos to load
        setTimeout(() => {
            checkVideoVisibility();
        }, 300);
        
        // Debounced scroll check
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
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
