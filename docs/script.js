document.addEventListener('DOMContentLoaded', function() {
    // Initialize canvas for dynamic background
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match window
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Mouse tracking
    let mouse = { x: 0, y: 0 };
    let lastScrollY = 0;
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    // Background properties
    const gridSize = 30;
    const particleCount = 100;
    const particles = [];
    
    // Create particles
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.color = this.getRandomColor();
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        
        getRandomColor() {
            const colors = [
                'rgba(109, 40, 217, OPACITY)', // Purple (primary)
                'rgba(16, 185, 129, OPACITY)', // Green (secondary)
                'rgba(245, 158, 11, OPACITY)'  // Amber (accent)
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Attraction to mouse
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                this.speedX += dx * 0.0005;
                this.speedY += dy * 0.0005;
            }
            
            // Boundary check
            if (this.x < 0 || this.x > canvas.width || 
                this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
            
            // Speed limit
            this.speedX = Math.min(Math.max(this.speedX, -2), 2);
            this.speedY = Math.min(Math.max(this.speedY, -2), 2);
        }
        
        draw() {
            ctx.fillStyle = this.color.replace('OPACITY', this.opacity);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create grid points
    class GridPoint {
        constructor(x, y) {
            this.originX = x;
            this.originY = y;
            this.x = x;
            this.y = y;
            this.size = 1;
            this.color = 'rgba(109, 40, 217, 0.3)';
            this.connections = [];
        }
        
        update(mouseX, mouseY, scrollY) {
            // Add some wave effect
            const time = Date.now() * 0.001;
            const waveX = Math.sin(time * 0.5 + this.originY * 0.01) * 5;
            const waveY = Math.cos(time * 0.3 + this.originX * 0.01) * 5;
            
            // Mouse influence (subtle)
            const dx = mouseX - this.originX;
            const dy = mouseY - this.originY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 200;
            
            let mouseInfluenceX = 0;
            let mouseInfluenceY = 0;
            
            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                mouseInfluenceX = dx * force * 0.1;
                mouseInfluenceY = dy * force * 0.1;
            }
            
            // Scroll influence
            const scrollInfluence = (scrollY * 0.05) % (gridSize * 2);
            
            // Update position
            this.x = this.originX + waveX + mouseInfluenceX;
            this.y = this.originY + waveY + mouseInfluenceY + scrollInfluence;
            
            // Update color based on mouse proximity
            if (distance < maxDistance) {
                const alpha = 0.3 + (maxDistance - distance) / maxDistance * 0.4;
                this.color = `rgba(109, 40, 217, ${alpha})`;
                this.size = 1 + (maxDistance - distance) / maxDistance * 1.5;
            } else {
                this.color = 'rgba(109, 40, 217, 0.3)';
                this.size = 1;
            }
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        drawConnections() {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 0.5;
            
            this.connections.forEach(point => {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            });
        }
    }
    
    // Initialize grid
    const grid = [];
    let gridConnections = [];
    
    function initializeGrid() {
        grid.length = 0;
        
        const spacingX = canvas.width / Math.floor(canvas.width / gridSize);
        const spacingY = canvas.height / Math.floor(canvas.height / gridSize);
        
        for (let y = 0; y < canvas.height; y += spacingY) {
            for (let x = 0; x < canvas.width; x += spacingX) {
                grid.push(new GridPoint(x, y));
            }
        }
        
        // Create connections
        for (let i = 0; i < grid.length; i++) {
            const point = grid[i];
            for (let j = 0; j < grid.length; j++) {
                if (i !== j) {
                    const otherPoint = grid[j];
                    const dx = point.originX - otherPoint.originX;
                    const dy = point.originY - otherPoint.originY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < gridSize * 1.5) {
                        point.connections.push(otherPoint);
                    }
                }
            }
        }
    }
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    initializeGrid();
    window.addEventListener('resize', initializeGrid);
    
    // Click effect
    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        document.body.appendChild(ripple);
        
        // Set position
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        
        // Remove after animation completes
        setTimeout(() => {
            document.body.removeChild(ripple);
        }, 1000);
    }
    
    function createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'click-particle';
            
            // Set position
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            document.body.appendChild(particle);
            
            // Animate
            let posX = x;
            let posY = y;
            let opacity = 1;
            let gravity = 0.1;
            
            const animate = () => {
                posX += vx;
                posY += vy + gravity;
                gravity += 0.05;
                opacity -= 0.02;
                
                particle.style.left = `${posX}px`;
                particle.style.top = `${posY}px`;
                particle.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    document.body.removeChild(particle);
                }
            };
            
            requestAnimationFrame(animate);
        }
    }
    
    window.addEventListener('click', (e) => {
        createRipple(e.clientX, e.clientY);
        createParticles(e.clientX, e.clientY);
    });
    
    // Main animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update scroll position
        const scrollY = window.scrollY;
        
        // Draw grid with scroll effect
        ctx.globalAlpha = 0.5;
        grid.forEach(point => {
            point.update(mouse.x, mouse.y, scrollY);
            point.drawConnections();
            point.draw();
        });
        
        // Draw particles
        ctx.globalAlpha = 1;
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        lastScrollY = scrollY;
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Game functionality code
    let level = 1;
    let exp = 0;
    let maxExp = 100;
    let achievements = 0;
    let quests = 0;
    let projectsExplored = 0;
    let servicesViewed = 0;
    let skillsViewed = false;
    
    // Update HUD displays
    function updateHUD() {
        document.getElementById('level-display').textContent = level;
        document.getElementById('exp-fill').style.width = (exp / maxExp * 100) + '%';
        document.getElementById('achievements-count').textContent = achievements;
        document.getElementById('quests-count').textContent = quests;
    }
    
    // Add experience points
    function addExp(amount) {
        exp += amount;
        if (exp >= maxExp) {
            level++;
            exp = exp - maxExp;
            maxExp = Math.floor(maxExp * 1.5);
            showBanner(`Level Up! You're now level ${level}`);
        }
        updateHUD();
    }
    
    // Show achievement banner
    function showBanner(message) {
        const banner = document.getElementById('achievement-banner');
        document.getElementById('achievement-name').textContent = message;
        banner.classList.add('show');
        
        setTimeout(() => {
            banner.classList.remove('show');
        }, 3000);
    }
    
    // Unlock achievement
    function unlockAchievement(id, name) {
        const achievement = document.getElementById(id);
        if (achievement && !achievement.classList.contains('unlocked')) {
            achievement.classList.add('unlocked');
            achievements++;
            updateHUD();
            showBanner(`Achievement: ${name}`);
            addExp(25);
            updateQuestProgress('quest-4', achievements, 5);
        }
    }
    
    // Update quest progress
    function updateQuestProgress(questId, current, total) {
        const progressBar = document.getElementById(`${questId}-progress`);
        if (progressBar) {
            const percent = (current / total) * 100;
            progressBar.style.width = `${percent}%`;
            const questText = progressBar.parentElement.nextElementSibling;
            if (questText) {
                questText.textContent = `${current}/${total}`;
            }
            
            if (current >= total && !document.getElementById(questId).classList.contains('quest-complete')) {
                document.getElementById(questId).classList.add('quest-complete');
                quests++;
                updateHUD();
                showBanner('Quest Completed!');
                addExp(50);
            }
        }
    }
    
    // Parallax effect on scroll
    window.addEventListener('scroll', function() {
        const scrollPosition = window.pageYOffset;
        const parallaxLayers = document.querySelectorAll('.parallax-layer');
        
        parallaxLayers.forEach(layer => {
            const speed = layer.getAttribute('data-speed');
            layer.style.transform = `translateY(${scrollPosition * speed}px)`;
        });
        
        // Check for section visibility to unlock achievements
        const sections = ['projects', 'skills', 'services', 'contact'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element && isElementInViewport(element)) {
                switch(section) {
                    case 'projects':
                        unlockAchievement('achievement-explorer', 'Explorer');
                        break;
                    case 'skills':
                        if (!skillsViewed) {
                            skillsViewed = true;
                            updateQuestProgress('quest-2', 1, 1);
                        }
                        unlockAchievement('achievement-skillmaster', 'Skill Master');
                        break;
                    case 'services':
                        unlockAchievement('achievement-service', 'Service Discoverer');
                        break;
                    case 'contact':
                        unlockAchievement('achievement-networker', 'Networker');
                        break;
                }
            }
        });
    });
    
    // Check if element is in viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight)
        );
    }
    
    // Project card hover tracking
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('explored')) {
                this.classList.add('explored');
                projectsExplored++;
                addExp(10);
                updateQuestProgress('quest-1', projectsExplored, 4);
                
                if (projectsExplored >= 4 && achievements >= 4) {
                    unlockAchievement('achievement-completionist', 'Completionist');
                }
            }
        });
    });
    
    // Interactive skill bars
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => {
        const progressBar = item.querySelector('.progress-bar');
        const width = progressBar.getAttribute('data-width');
        
        // Set up hover effect for skill item
        item.addEventListener('mouseenter', function() {
            progressBar.style.width = width;
        });
        
        item.addEventListener('mouseleave', function() {
            progressBar.style.width = '0%';
        });
    });
    
    // Service selection tracking
    const serviceButtons = document.querySelectorAll('.bg-gray-800.rounded-lg.p-6 button');
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const service = this.closest('.bg-gray-800.rounded-lg.p-6');
            
            if (!service.classList.contains('viewed')) {
                service.classList.add('viewed');
                servicesViewed++;
                addExp(20);
                updateQuestProgress('quest-3', servicesViewed, 6);
            }
            
            // Simulate selection effect
            this.textContent = 'SELECTED';
            this.classList.add('glow');
            
            setTimeout(() => {
                this.textContent = 'SELECT';
                this.classList.remove('glow');
            }, 2000);
        });
    });
    
    // Button interactions
    document.getElementById('start-quest').addEventListener('click', function() {
        document.getElementById('projects').scrollIntoView({behavior: 'smooth'});
        addExp(5);
    });
    
    document.getElementById('view-skills').addEventListener('click', function() {
        document.getElementById('skills').scrollIntoView({behavior: 'smooth'});
        addExp(5);
    });
    
    document.getElementById('send-message').addEventListener('click', function() {
        const nameField = document.getElementById('name');
        const emailField = document.getElementById('email');
        const messageField = document.getElementById('message');
        
        if (nameField.value && emailField.value && messageField.value) {
            this.textContent = 'SENDING...';
            
            setTimeout(() => {
                this.textContent = 'MESSAGE SENT!';
                this.disabled = true;
                this.classList.add('bg-green-800');
                addExp(30);
                showBanner('Message sent successfully!');
            }, 1500);
        } else {
            showBanner('Please fill all required fields');
        }
    });
    
    // Initialize HUD
    update