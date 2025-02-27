<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/spinning-circle.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Inter:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>

    <header>
        <h1>Pierce Lawson</h1>
        <p>Animator | Visionary | Creator</p>
    </header>
    <section id="hero">
        <div class="hero-content">
            <h1>Welcome to My World of Animation</h1>
            <p>Bringing stories to life, one frame at a time.</p>
            <a href="#gallery" class="hero-btn">Explore My Work</a>
        </div>
    </section>
    <!-- <section id="about">
        <h2>About Me</h2>
        <div class="about-content">
            <p class="about-text">Hi, I’m Pierce Lawson, a passionate animator with a knack for turning ideas into motion. With years of experience in motion graphics and 3D animation, I thrive on crafting visuals that captivate and inspire. When I’m not animating, you’ll find me sketching or exploring new tech.</p>
            <img src="assets/media/Get lost.png" alt="Pierce Lawson" class="about-image">
        </div>
    </section> -->
    <section id="gallery">
        <h2>Featured Projects</h2>
        <div class="gallery-grid">
            <?php
            $projects = [
                ['href' => 'project1.php', 'src' => 'https://www.w3schools.com/html/mov_bbb.mp4', 'title' => 'Education Credit Union - Auto Loan Refinancing', 'poster' => 'assets/media/video/APH-0924-115R-poster.jpg'],
                ['href' => 'project2.php', 'src' => 'https://www.w3schools.com/html/mov_bbb.mp4', 'title' => 'Project 2', 'poster' => 'assets/media/video/project2-poster.jpg'],
                ['href' => 'project3.php', 'src' => 'https://www.w3schools.com/html/mov_bbb.mp4', 'title' => 'Project 3', 'poster' => 'assets/media/video/project3-poster.jpg'],
                ['href' => 'project4.php', 'src' => 'https://www.w3schools.com/html/mov_bbb.mp4', 'title' => 'Project 4', 'poster' => 'assets/media/project4-preview-poster.jpg'],
                ['href' => 'project5.php', 'src' => 'https://www.w3schools.com/html/mov_bbb.mp4', 'title' => 'Project 5', 'poster' => 'assets/media/project5-preview-poster.jpg'],
                ['href' => 'project6.php', 'src' => 'https://www.w3schools.com/html/mov_bbb.mp4', 'title' => 'Project 6', 'poster' => 'assets/media/project6-preview-poster.jpg'],
                ['href' => 'graphic-design.php', 'src' => 'assets/media/graphic-design/graphic1.jpg', 'title' => 'Graphic Design Works', 'isImage' => true]
            ];
            foreach ($projects as $project) {
                echo '<div class="gallery-item"><a href="' . $project['href'] . '" class="gallery-card-link"><div class="gallery-card">';
                if (isset($project['isImage'])) {
                    echo '<img src="' . $project['src'] . '" alt="' . $project['title'] . '">';
                } else {
                    // Ensure poster is always set with a fallback to empty string
                    $posterAttr = !empty($project['poster']) ? ' poster="' . $project['poster'] . '"' : '';
                    echo '<video muted loop playsinline preload="metadata"' . $posterAttr . '><source src="' . $project['src'] . '" type="video/mp4">Your browser doesn\'t support video.</video>';
                }
                echo '<div class="gallery-overlay"><h3>' . $project['title'] . '</h3></div></div></a></div>';
            }
            ?>
        </div>
    </section>
    <footer>
        <p>Contact: your.email@example.com | <a href="https://yourlink.com">More Work</a></p>
        <?php include 'includes/spinning-circle.php'; ?>
    </footer>

    <script src="assets/js/scripts.js" defer></script>
</body>
</html>