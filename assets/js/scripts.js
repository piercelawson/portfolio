document.addEventListener('DOMContentLoaded', () => {
    // [Gallery and header logic unchanged, skipping for brevity]
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

    // [Gallery video logic unchanged, skipping for brevity]

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

        // Scroll event with reduced sensitivity
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;

            // Slower rotation response
            velocity += scrollDelta * 0.2; // Reduced from 0.5 to 0.2
            lastScrollY = currentScrollY;

            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(animate);
            }
        });

        // Hover scaling
        spinningCircle.style.transform = 'scale(0.75)';
        spinningCircle.addEventListener('mouseenter', () => {
            spinningCircle.style.transform = 'scale(1)';
        });
        spinningCircle.addEventListener('mouseleave', () => {
            spinningCircle.style.transform = 'scale(0.75)';
        });

        // Footer visibility observer
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    spinningCircle.style.opacity = '0';
                    velocity = 0;
                    isAnimating = false;
                } else {
                    spinningCircle.style.opacity = '1';
                }
            });
        }, {
            rootMargin: '0px',
            threshold: 0.1
        });

        footerObserver.observe(footer);
    } else {
        console.warn('Spinning circle element not found.');
    }
});