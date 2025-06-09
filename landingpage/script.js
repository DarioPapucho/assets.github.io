// Mobile Menu Toggle
function showMenu() {
  const navLinks = document.getElementById("navLinks");
  navLinks.style.right = "0";
  navLinks.classList.add("active");
  document.body.style.overflow = "hidden";
}

function hideMenu() {
  const navLinks = document.getElementById("navLinks");
  navLinks.style.right = "-250px";
  navLinks.classList.remove("active");
  document.body.style.overflow = "";
}

// Navbar Scroll Effect
window.addEventListener("scroll", () => {
  const nav = document.querySelector("nav");
  if (window.scrollY > 100) {
    nav.style.padding = "10px 0";
    nav.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  } else {
    nav.style.padding = "20px 0";
    nav.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  }
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    hideMenu();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Carousel Functionality
class GalleryCarousel {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll(".carousel-slide");
    this.indicators = document.querySelectorAll(".indicator");
    this.track = document.getElementById("carouselTrack");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.autoPlayInterval = null;

    this.init();
  }

  init() {
    if (!this.track) return;

    // Event listeners
    this.prevBtn?.addEventListener("click", () => this.prevSlide());
    this.nextBtn?.addEventListener("click", () => this.nextSlide());

    // Indicator clicks
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToSlide(index));
    });

    // Touch/swipe support
    this.addTouchSupport();

    // Auto-play
    this.startAutoPlay();

    // Pause auto-play on hover
    this.track.addEventListener("mouseenter", () => this.stopAutoPlay());
    this.track.addEventListener("mouseleave", () => this.startAutoPlay());
  }

  goToSlide(slideIndex) {
    this.currentSlide = slideIndex;
    const translateX = -slideIndex * 100;
    this.track.style.transform = `translateX(${translateX}%)`;

    // Update indicators
    this.indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === slideIndex);
    });

    // Update slides
    this.slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === slideIndex);
    });
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(this.currentSlide);
  }

  prevSlide() {
    this.currentSlide =
      this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
    this.goToSlide(this.currentSlide);
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  addTouchSupport() {
    let startX = 0;
    let endX = 0;

    this.track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );

    this.track.addEventListener(
      "touchend",
      (e) => {
        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            this.nextSlide();
          } else {
            this.prevSlide();
          }
        }
      },
      { passive: true }
    );
  }
}

// Reemplazar la clase ScheduleManager con esta versión mejorada
class ScheduleManager {
  constructor() {
    this.scheduleData = null;
    this.currentDay = "monday";
    this.init();
  }

  async init() {
    await this.loadScheduleData();
    this.setupTabs();
    this.displaySchedule(this.currentDay);
  }

  async loadScheduleData() {
    try {
      const response = await fetch(
        "https://dariopapucho.github.io/assets.github.io/jsons/group_schedules.json"
      );
      const data = await response.json();
      this.scheduleData = data.group_schedules;
    } catch (error) {
      console.error("Error loading schedule data:", error);
      this.showError();
    }
  }

  setupTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const day = btn.dataset.day;
        this.switchDay(day);
      });
    });
  }

  switchDay(day) {
    this.currentDay = day;

    // Update active tab
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.day === day);
    });

    this.displaySchedule(day);
  }

  displaySchedule(day) {
    const scheduleContent = document.getElementById("scheduleContent");

    if (!this.scheduleData || !this.scheduleData[day]) {
      scheduleContent.innerHTML =
        '<div class="no-classes">No hay clases programadas para este día</div>';
      return;
    }

    const dayData = this.scheduleData[day];
    let html = `<div class="day-schedule active">`;

    // Morning shift
    if (dayData.morning_shift && dayData.morning_shift.length > 0) {
      html += `
          <div class="shift-section">
            <h4 class="shift-title">Turno Mañana</h4>
            <div class="classes-grid">
              ${dayData.morning_shift
                .map((classItem) => this.createClassItem(classItem))
                .join("")}
            </div>
          </div>
        `;
    }

    // Night shift
    if (dayData.night_shift && dayData.night_shift.length > 0) {
      html += `
          <div class="shift-section">
            <h4 class="shift-title">Turno Noche</h4>
            <div class="classes-grid">
              ${dayData.night_shift
                .map((classItem) => this.createClassItem(classItem))
                .join("")}
            </div>
          </div>
        `;
    }

    html += "</div>";
    scheduleContent.innerHTML = html;

    // Add fade-in animation
    setTimeout(() => {
      document.querySelectorAll(".class-item").forEach((item, index) => {
        setTimeout(() => {
          item.classList.add("fade-in");
        }, index * 100);
      });
    }, 50);
  }

  createClassItem(classData) {
    return `
        <div class="class-item">
          <div class="class-time">${classData.time}</div>
          <div class="class-discipline">${classData.discipline}</div>
          <div class="class-instructor">Instructor: ${classData.instructor}</div>
        </div>
      `;
  }

  showError() {
    const scheduleContent = document.getElementById("scheduleContent");
    scheduleContent.innerHTML = `
        <div class="no-classes">
          Error al cargar los horarios. Por favor, intenta más tarde.
        </div>
      `;
  }
}

// Form Submission
const forms = document.querySelectorAll("form");
forms.forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("¡Gracias por tu mensaje! Te contactaremos pronto.");
    form.reset();
  });
});

// Animation on Scroll
window.addEventListener("scroll", () => {
  const elements = document.querySelectorAll(
    ".benefit-card, .team-member, .price-card, .testimonial"
  );

  elements.forEach((element) => {
    const position = element.getBoundingClientRect();

    if (position.top < window.innerHeight && position.bottom >= 0) {
      element.style.opacity = "1";
      element.style.transform = "translateY(0)";
    }
  });
});

// Video Carousel Functionality
class VideoCarousel {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll(".video-slide");
    this.indicators = document.querySelectorAll(".video-indicator");
    this.track = document.getElementById("videoTrack");
    this.prevBtn = document.getElementById("videoPrevBtn");
    this.nextBtn = document.getElementById("videoNextBtn");
    this.autoPlayInterval = null;

    if (!this.track) return;

    this.init();
  }

  init() {
    // Event listeners
    this.prevBtn?.addEventListener("click", () => this.prevSlide());
    this.nextBtn?.addEventListener("click", () => this.nextSlide());

    // Indicator clicks
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToSlide(index));
    });

    // Pause video when switching slides
    this.slides.forEach((slide) => {
      const iframe = slide.querySelector("iframe");
      if (iframe) {
        const videoSrc = iframe.src;
        slide.addEventListener("transitionend", () => {
          if (!slide.classList.contains("active")) {
            // Pause video by reloading iframe
            iframe.src = videoSrc;
          }
        });
      }
    });
  }

  goToSlide(slideIndex) {
    // Remove active class from current slide and indicator
    this.slides[this.currentSlide].classList.remove("active");
    this.indicators[this.currentSlide].classList.remove("active");

    // Update current slide
    this.currentSlide = slideIndex;

    // Add active class to new slide and indicator
    this.slides[this.currentSlide].classList.add("active");
    this.indicators[this.currentSlide].classList.add("active");

    // Update transform
    this.track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex =
      this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
    this.goToSlide(prevIndex);
  }
}

// Team Carousel Class
class TeamCarousel {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll(".team-slide");
    this.indicators = document.querySelectorAll(".team-indicator");
    this.track = document.getElementById("teamTrack");
    this.prevBtn = document.getElementById("teamPrevBtn");
    this.nextBtn = document.getElementById("teamNextBtn");
    this.autoPlayInterval = null;

    if (!this.track) return;

    this.init();
  }

  init() {
    // Event listeners
    this.prevBtn?.addEventListener("click", () => this.prevSlide());
    this.nextBtn?.addEventListener("click", () => this.nextSlide());

    // Indicator clicks
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToSlide(index));
    });

    // Start autoplay
    this.startAutoPlay();

    // Pause on hover
    this.track.addEventListener("mouseenter", () => this.stopAutoPlay());
    this.track.addEventListener("mouseleave", () => this.startAutoPlay());

    // Touch support
    this.addTouchSupport();
  }

  goToSlide(slideIndex) {
    // Remove active class from current slide and indicator
    this.slides[this.currentSlide].classList.remove("active");
    this.indicators[this.currentSlide].classList.remove("active");

    // Update current slide
    this.currentSlide = slideIndex;

    // Add active class to new slide and indicator
    this.slides[this.currentSlide].classList.add("active");
    this.indicators[this.currentSlide].classList.add("active");

    // Update transform
    this.track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex =
      this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
    this.goToSlide(prevIndex);
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  addTouchSupport() {
    let startX = 0;
    let endX = 0;

    this.track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );

    this.track.addEventListener(
      "touchend",
      (e) => {
        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            this.nextSlide();
          } else {
            this.prevSlide();
          }
        }
      },
      { passive: true }
    );
  }
}

// Testimonials Carousel Class
class TestimonialsCarousel {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll(".testimonial-slide");
    this.indicators = document.querySelectorAll(".testimonial-indicator");
    this.track = document.getElementById("testimonialsTrack");
    this.prevBtn = document.getElementById("testimonialsPrevBtn");
    this.nextBtn = document.getElementById("testimonialsNextBtn");
    this.autoPlayInterval = null;

    if (!this.track) return;

    this.init();
  }

  init() {
    // Event listeners
    this.prevBtn?.addEventListener("click", () => this.prevSlide());
    this.nextBtn?.addEventListener("click", () => this.nextSlide());

    // Indicator clicks
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToSlide(index));
    });

    // Start autoplay
    this.startAutoPlay();

    // Pause on hover
    this.track.addEventListener("mouseenter", () => this.stopAutoPlay());
    this.track.addEventListener("mouseleave", () => this.startAutoPlay());

    // Touch support
    this.addTouchSupport();
  }

  goToSlide(slideIndex) {
    // Remove active class from current slide and indicator
    this.slides[this.currentSlide].classList.remove("active");
    this.indicators[this.currentSlide].classList.remove("active");

    // Update current slide
    this.currentSlide = slideIndex;

    // Add active class to new slide and indicator
    this.slides[this.currentSlide].classList.add("active");
    this.indicators[this.currentSlide].classList.add("active");

    // Update transform
    this.track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex =
      this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
    this.goToSlide(prevIndex);
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 6000); // Slightly different timing than team carousel
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  addTouchSupport() {
    let startX = 0;
    let endX = 0;

    this.track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );

    this.track.addEventListener(
      "touchend",
      (e) => {
        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            this.nextSlide();
          } else {
            this.prevSlide();
          }
        }
      },
      { passive: true }
    );
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all carousels
  new GalleryCarousel();
  new VideoCarousel();
  new TeamCarousel();
  new TestimonialsCarousel();
  new ScheduleManager();

  // Initialize scroll animations
  const elements = document.querySelectorAll(
    ".benefit-card, .team-member, .price-card, .testimonial"
  );
  elements.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(20px)";
    element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  });

  // Trigger scroll event to check initial elements in viewport
  window.dispatchEvent(new Event("scroll"));

  // Touch device detection
  if ("ontouchstart" in window || navigator.maxTouchPoints) {
    document.body.classList.add("touch");
  }
});

// Handle orientation change
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    window.dispatchEvent(new Event("scroll"));
    if (window.innerWidth <= 768) {
      hideMenu();
    }
  }, 200);
});

// Intersection Observer for better performance
if ("IntersectionObserver" in window) {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements when they're added to the DOM
  setTimeout(() => {
    document
      .querySelectorAll(
        ".benefit-card, .team-member, .price-card, .testimonial"
      )
      .forEach((el) => {
        observer.observe(el);
      });
  }, 100);
}
