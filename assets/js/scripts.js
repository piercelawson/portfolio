document.addEventListener('DOMContentLoaded', () => {
    // Gallery Video Playback and Header Shrink
    const galleryCards = document.querySelectorAll('.gallery-card');
    const header = document.querySelector('header');
    const hero = document.querySelector('#hero');
    const footer = document.querySelector('footer');
    const spinningCircle = document.querySelector('.spinning-circle');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let currentPlaying = null;
    let overlayTimeout = null;
    let scrollTimeout = null;
    let rotation = 0;
    let isSpinning = false;
    const playedVideos = new Set(); // Track videos that have played at least once

    // Debugging: Log initial setup
    console.log('Gallery cards found:', galleryCards.length);
    console.log('Is mobile:', isMobile);

    // Pause all videos initially and remove autoplay
    galleryCards.forEach(card => {
        const video = card.querySelector('video');
        if (video) {
            video.pause();
            video.removeAttribute('autoplay');
            console.log('Video found in card:', video.src); // Log video sources
        } else {
            console.warn('No video found in card:', card);
        }
    });

    // Function to hide overlay (with delay for first play, immediate for subsequent)
    const hideOverlay = (card, video) => {
        clearTimeout(overlayTimeout);
        if (!playedVideos.has(video)) {
            console.log('First play for video:', video.src);
            overlayTimeout = setTimeout(() => {
                card.classList.add('playing');
                playedVideos.add(video); // Mark as played
                console.log('Overlay hidden after 2s for:', video.src);
            }, 2000);
        } else {
            console.log('Subsequent play, hiding overlay immediately for:', video.src);
            card.classList.add('playing');
        }
    };

    // Function to reset overlay (show text immediately)
    const resetOverlay = (card) => {
        clearTimeout(overlayTimeout);
        card.classList.remove('playing');
        console.log('Overlay reset for card:', card);
    };

    // Gallery video logic
    if (isMobile) {
        // Intersection Observer for mobile: play only the most centered video
        const observer = new IntersectionObserver((entries, observer) => {
            let centeredVideo = null;
            let minDistance = Infinity;

            entries.forEach(entry => {
                const video = entry.target.querySelector('video');
                if (video) {
                    const rect = entry.target.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const viewportCenter = viewportHeight / 2;
                    const videoCenter = rect.top + (rect.height / 2);
                    const distanceFromCenter = Math.abs(viewportCenter - videoCenter);

                    if (entry.isIntersecting && distanceFromCenter < minDistance) {
                        minDistance = distanceFromCenter;
                        centeredVideo = { video, card: entry.target };
                    }
                }
            });

            // Handle playback for the most centered video
            if (centeredVideo) {
                if (currentPlaying && currentPlaying !== centeredVideo.video) {
                    currentPlaying.pause();
                    resetOverlay(currentPlaying.closest('.gallery-card'));
                }
                centeredVideo.video.play().then(() => {
                    console.log('Playing video:', centeredVideo.video.src);
                }).catch(error => {
                    console.error('Mobile video playback failed:', centeredVideo.video.src, error);
                });
                currentPlaying = centeredVideo.video;
                hideOverlay(centeredVideo.card, centeredVideo.video);
            } else if (currentPlaying) {
                currentPlaying.pause();
                resetOverlay(currentPlaying.closest('.gallery-card'));
                currentPlaying = null;
            }
        }, {
            rootMargin: '-45% 0px -45% 0px', // Narrow area (10% viewport height)
            threshold: 1.0 // Full visibility required
        });

        galleryCards.forEach(card => {
            observer.observe(card);
        });

        // Header shrink when scrolling past hero
        const handleScroll = () => {
            const heroBottom = hero.getBoundingClientRect().bottom;
            if (heroBottom < 0) {
                header.classList.add('shrunk');
            } else {
                header.classList.remove('shrunk');
            }
        };

        window.addEventListener('scroll', handleScroll);
    } else {
        // Desktop: hover to play and hide overlay
        galleryCards.forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                card.addEventListener('mouseenter', () => {
                    if (currentPlaying && currentPlaying !== video) {
                        currentPlaying.pause();
                        resetOverlay(currentPlaying.closest('.gallery-card'));
                    }
                    video.play().then(() => {
                        console.log('Playing video on desktop:', video.src);
                    }).catch(error => {
                        console.error('Desktop video playback failed:', video.src, error);
                    });
                    currentPlaying = video;
                    hideOverlay(card, video);
                });
                card.addEventListener('mouseleave', () => {
                    video.pause();
                    resetOverlay(card);
                    currentPlaying = null;
                });
            }
        });
    }

    // Spinning Circle Animation and Visibility
    if (spinningCircle) {
        const spinningGroup = spinningCircle.querySelector('.spinning-group');

        // Spin only while scrolling
        const spin = () => {
            if (isSpinning) {
                rotation += 2; // Adjust speed (e.g., 1 for slower, 4 for faster)
                spinningGroup.style.transform = `rotate(${rotation}deg)`;
                requestAnimationFrame(spin);
            }
        };

        // Scroll event to trigger spinning
        window.addEventListener('scroll', () => {
            if (!isSpinning) {
                isSpinning = true;
                requestAnimationFrame(spin);
            }
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isSpinning = false;
            }, 100); // Stop spinning 100ms after scroll ends
        });

        // Intersection Observer for footer: hide spinning circle when footer is in view
        const footerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    spinningCircle.style.opacity = '0';
                    spinningCircle.style.transition = 'opacity 0.3s ease';
                    isSpinning = false;
                } else {
                    spinningCircle.style.opacity = '1';
                }
            });
        }, {
            rootMargin: '0px',
            threshold: 0.1 // 10% of footer visible
        });

        footerObserver.observe(footer);
    } else {
        console.warn('Spinning circle element not found. Ensure .spinning-circle exists in the DOM from includes/spinning-circle.php.');
    }
});