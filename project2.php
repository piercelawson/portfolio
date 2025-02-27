<!-- project1.php (example) -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project 1</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/spinning-circle.css"> <!-- Readded -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Inter:wght@400;700&display=swap" rel="stylesheet">
</head>
<body class="project-page project1">
    <?php include 'includes/scroll-star.php'; ?>
    <header>
        <h1>Project 1</h1>
        <a href="index.php" class="back-btn">Back</a>
    </header>
    <section class="project-content">
        <div class="content-mix">
            <div class="video-container">
                <video autoplay loop playsinline class="project-video" id="projectVideo">
                    <source src="assets/media/project1/project1-video.mp4" type="video/mp4">
                    Your browser doesn’t support video.
                </video>
                <button class="play-button" id="playButton" style="display: none;">Play Video</button>
            </div>
            <img src="assets/media/project1/project1-img1.jpg" alt="Project 1 Image 1" class="img-large">
            <div class="description">
                <h2>Project 1: The Genesis</h2>
                <p>This is where it all began—a spark that turned into a blaze. Using [tools], I dove into [describe it], crafting a world of [theme]. The process was raw, unfiltered, and exhilarating.</p>
            </div>
            <img src="assets/media/project1/project1-img2.jpg" alt="Project 1 Image 2" class="img-medium">
            <p>Every frame was a battle—[specific task] took days, [another task] took nights. Inspired by [source], I mixed [style] with [another style], aiming for [goal]. The result? A piece that’s as chaotic as it is deliberate.</p>
            <img src="assets/media/project1/project1-img3.jpg" alt="Project 1 Image 3" class="img-small">
            <p>Challenges like [challenge] tested me, but they shaped the final cut. It’s not just motion—it’s emotion, designed to hit you with [feeling]. This project redefined [personal growth], and I’m only getting started.</p>
        </div>
    </section>
    <footer>
        <p>Contact: your.email@example.com | <a href="https://yourlink.com">More Work</a></p>
        <?php include 'includes/spinning-circle.php'; ?> <!-- Readded -->
    </footer>
    <script src="assets/js/scripts.js" defer></script>
</body>
</html>