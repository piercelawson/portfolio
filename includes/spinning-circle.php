<!-- includes/spinning-circle.php -->
<a href="mailto:<?php echo $email ?? 'pierceglawson@gmail.com'; ?>" class="spinning-circle-link" data-spinning-circle>
    <svg class="spinning-circle" width="100%" height="100%" viewBox="0 0 120 120">
        <g class="spinning-group">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e63946" stroke-width="8" />
            <text font-family="'Poppins', sans-serif" font-size="16" fill="#457b9d">
                <textPath href="#circlePath" startOffset="25%" text-anchor="middle">CONTACT ME</textPath>
            </text>
            <path id="circlePath" d="M 60,10 A 50,50 0 1,1 60,110 A 50,50 0 1,1 60,10" fill="none" stroke="none" />
        </g>
    </svg>
</a>