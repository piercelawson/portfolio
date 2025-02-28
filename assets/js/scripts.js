document.addEventListener('DOMContentLoaded', () => {
    const galleryCards = document.querySelectorAll('.gallery-card');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const spinningCircle = document.querySelector('.spinning-circle');
   
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let currentPlaying = null;
    let lastScrollY = window.scrollY;
    let rotation = 0;
    let velocity = 0;
    let isAnimating = false;

    // ---------- VIDEO HANDLING ----------

    // Preload video previews with first frame
    galleryCards.forEach(card => {
        const video = card.querySelector('video');
        if (video) {
            video.muted = true;
            video.playsinline = true;
            video.preload = 'metadata'; // Load metadata for first frame
            video.classList.add('video-preview', 'paused'); // Initial state
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = 0; // Set to first frame
                video.pause(); // Ensure paused
                console.log('First frame loaded for:', video.src); // Debug
            }, { once: true });
            // Fallback: Try setting frame if metadata is already cached
            if (video.readyState >= 1) { // HAVE_METADATA or higher
                video.currentTime = 0;
                video.pause();
            }
            video.load(); // Trigger loading
        }
    });

    // Play or pause video and toggle overlay/classes
    const toggleVideo = (card, shouldPlay) => {
        const video = card?.querySelector('video');
        const overlay = card?.querySelector('.gallery-overlay');
        if (!video || !overlay) return;

        if (shouldPlay) {
            if (currentPlaying && currentPlaying !== video) {
                currentPlaying.pause();
                currentPlaying.classList.add('paused');
                currentPlaying.closest('.gallery-card').classList.remove('playing');
                currentPlaying.closest('.gallery-card').querySelector('.gallery-overlay').style.opacity = '1';
            }
            video.play()
                .then(() => {
                    currentPlaying = video;
                    video.classList.remove('paused');
                    card.classList.add('playing');
                    overlay.style.opacity = '0';
                })
                .catch(e => console.warn('Playback failed:', e));
        } else {
            video.pause();
            video.classList.add('paused');
            card.classList.remove('playing');
            overlay.style.opacity = '1';
            if (currentPlaying === video) currentPlaying = null;
        }
    };

    // Desktop: Hover to play
    if (!isMobile) {
        galleryCards.forEach(card => {
            card.addEventListener('mouseenter', () => toggleVideo(card, true));
            card.addEventListener('mouseleave', () => toggleVideo(card, false));
        });
    }

    // Mobile: Play centered video on scroll
    if (isMobile) {
        const handleScrollVideos = () => {
            let closestCard = null;
            let minDistance = Infinity;
            let playingIndex = -1;

            // Convert NodeList to Array for reliable indexing
            const cardsArray = Array.from(galleryCards);

            // Find the closest card and its index
            cardsArray.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const centerDistance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
                const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
                const withinViewport = centerDistance < window.innerHeight * 0.5;

                if (isVisible && withinViewport && centerDistance < minDistance) {
                    minDistance = centerDistance;
                    closestCard = card;
                    playingIndex = index;
                }
            });

            // Debugging: Log to ensure correct card is detected
            console.log('Playing Index:', playingIndex, 'Closest Card:', closestCard);

            // Toggle playback and darken adjacent cards
            cardsArray.forEach((card, index) => {
                const shouldPlay = card === closestCard;
                toggleVideo(card, shouldPlay);

                // Remove darkening from all cards first
                card.classList.remove('adjacent-darkened');

                // Apply darkening to adjacent cards
                if (shouldPlay && (index === playingIndex - 1 || index === playingIndex + 1)) {
                    card.classList.add('adjacent-darkened');
                    console.log('Darkening card at index:', index);
                }
            });
        };

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScrollVideos, 50);
        });
        handleScrollVideos(); // Initial check
    }

    // ---------- HEADER & SPINNING CIRCLE ----------

    if (spinningCircle) {
        const spinningGroup = spinningCircle.querySelector('.spinning-group');
        if (!spinningGroup) {
            console.error('Spinning group not found in spinning-circle element');
            return;
        }

        // JS only needs to handle dynamic scaling and rotation
        spinningCircle.style.transition = 'transform 0.5s ease-in-out, opacity 0.3s ease';
        spinningCircle.style.opacity = '1';

        // Hover events
        spinningCircle.addEventListener('mouseenter', () => {
            spinningCircle.style.transform = 'scale(1)';
        });
        spinningCircle.addEventListener('mouseleave', () => {
            spinningCircle.style.transform = 'scale(0.75)';
        });

        // Rotation animation
        const animateCircle = () => {
            if (Math.abs(velocity) > 0.05) {
                rotation += velocity;
                spinningGroup.style.transform = `rotate(${rotation}deg)`;
                velocity *= 0.5;
                requestAnimationFrame(animateCircle);
            } else {
                isAnimating = false;
            }
        };

        // Scroll handler
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            header.classList.toggle('shrunk', currentScrollY > 100);

            const scrollDelta = currentScrollY - lastScrollY;
            velocity += scrollDelta * 0.3;
            lastScrollY = currentScrollY;

            if (!isAnimating && Math.abs(velocity) > 0.05) {
                isAnimating = true;
                requestAnimationFrame(animateCircle);
            }
        };

        // Footer observer
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                spinningCircle.style.opacity = entry.isIntersecting ? '0' : '1';
                if (entry.isIntersecting) velocity = 0;
            });
        }, { threshold: 0.1 });
        observer.observe(footer);

        window.addEventListener('scroll', handleScroll);
    } else {
        console.warn('Spinning circle element not found');
    }




    // Scroll to slightly above gallery from hero button
    const scrollToGalleryBtn = document.getElementById('scroll-to-gallery');
    if (scrollToGalleryBtn) {
        scrollToGalleryBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor jump
            const gallerySection = document.getElementById('gallery');
            if (gallerySection) {
                const offset = 100; // Pixels above the gallery section
                const galleryTop = gallerySection.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: galleryTop - offset,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Project page video autoplay
    const projectVideo = document.getElementById('projectVideo');
    if (projectVideo) {
        projectVideo.play().catch(() => {
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.style.display = 'block';
                playButton.addEventListener('click', () => {
                    projectVideo.play();
                    playButton.style.display = 'none';
                });
            }
        });
    }


    // Particle burst for hero button
    const heroBtn = document.querySelector('.hero-btn');
    if (heroBtn) {
        heroBtn.addEventListener('mouseenter', () => {
            for (let i = 0; i < 6; i++) {
                const particle = document.createElement('span');
                particle.className = 'hero-particle';
                particle.style.position = 'absolute';
                particle.style.width = '6px';
                particle.style.height = '6px';
                particle.style.background = '#e63946';
                particle.style.borderRadius = '50%';
                particle.style.pointerEvents = 'none';
                particle.style.zIndex = '1';

                // Random start position near center
                const xStart = heroBtn.offsetWidth / 2;
                const yStart = heroBtn.offsetHeight / 2;
                particle.style.left = `${xStart}px`;
                particle.style.top = `${yStart}px`;

                // Random direction and distance
                const angle = Math.random() * 2 * Math.PI;
                const distance = 20 + Math.random() * 20;
                const duration = 0.5 + Math.random() * 0.3;

                heroBtn.appendChild(particle);

                particle.animate([
                    { transform: 'translate(0, 0)', opacity: 1 },
                    { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`, opacity: 0 }
                ], {
                    duration: duration * 1000,
                    easing: 'ease-out',
                    fill: 'forwards'
                }).onfinish = () => particle.remove();
            }
        });
    }
});