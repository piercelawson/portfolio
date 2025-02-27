
document.addEventListener('DOMContentLoaded', () => {
    const galleryCards = document.querySelectorAll('.gallery-card');
    const header = document.querySelector('header');
    const hero = document.querySelector('#hero');
    const footer = document.querySelector('footer');
    const spinningCircle = document.querySelector('[data-spinning-circle] .spinning-circle');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let currentPlaying = null;
    let overlayTimeout = null;
    let lastScrollY = window.scrollY;
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

    // Handle video playback
    function handleVideoPlayback(card, shouldPlay) {
        const video = card.querySelector('video');
        if (!video) {
            console.log("No video found in card:", card);
            return;
        }
        
        console.log("Video found in card:", video.src);
        
        if (shouldPlay) {
            if (!playedVideos.has(video)) {
                console.log("First play for video:", video.src);
                playedVideos.add(video);
            }
            
            video.play().then(() => {
                console.log("Playing video:", video.src);
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
            }).catch(err => {
                console.log("Mobile video playback failed:", video.src, err);
            });
        } else {
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
    
    // Mobile scroll behavior
    if (isMobile) {
        function checkVideoVisibility() {
            galleryCards.forEach(card => {
                if (isInViewport(card)) {
                    handleVideoPlayback(card, true);
                } else {
                    handleVideoPlayback(card, false);
                }
            });
        }
        
        // Initial check on page load
        checkVideoVisibility();
        
        // Check on scroll
        window.addEventListener('scroll', () => {
            checkVideoVisibility();
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
        let rotation = 0;
        let velocity = 0;
        let isAnimating = false;
        
        // Animation loop with slower easing
        const animate = () => {
            if (Math.abs(velocity) > 0.1 || isAnimating) {
                rotation += velocity;
                spinningGroup.style.transform = `rotate(${rotation}deg)`;
                velocity *= 0.97; // Slower decay for longer, gentler coasting
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
            if (Math.abs(velocity) > 0.1 || isAnimating) {
                rotation += velocity;
                spinningGroup.style.transform = `rotate(${rotation}deg)`;
                velocity *= 0.97; // Slower decay for longer, gentler coasting
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
