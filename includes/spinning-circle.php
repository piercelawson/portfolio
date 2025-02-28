<!-- includes/spinning-circle.php -->
<a href="mailto:<?php echo $email ?? 'pierceglawson@gmail.com'; ?>" class="spinning-circle-link" data-spinning-circle>
    <svg class="spinning-circle" width="100%" height="100%" viewBox="0 0 140 140">
        <g class="spinning-group">
            <!-- Outer circle (unchanged) -->
            <circle cx="70" cy="70" r="60" fill="none" stroke="#457b9d" stroke-width="4" />
            <!-- Circular path for text with reduced radius -->
            <path id="circlePath" d="M 70,30 A 40,40 0 1,1 70,110 A 40,40 0 1,1 70,30" fill="none" stroke="none" />
            <!-- Rotating text -->
            <text font-family="'Poppins', sans-serif" font-size="18" fill="#457b9d">
                <textPath href="#circlePath" startOffset="50%" text-anchor="middle">CONTACT ME CONTACT ME</textPath>
            </text>
        </g>
    </svg>
</a>