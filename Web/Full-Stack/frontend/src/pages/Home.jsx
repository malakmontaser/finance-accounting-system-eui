import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import heroImage from '../assets/images/finance-illustration.png';
import './Home.css';

// Features Data
const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    title: "Track Expenses",
    description: "Monitor all tuition payments and financial transactions in real-time"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    title: "Generate Reports",
    description: "Create detailed financial reports at student, faculty, and university levels"
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    title: "Secure Access",
    description: "Role-based access control for students, finance, and administration"
  }
];

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="hero-section">
        {/* Text Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to the Financial <br />
            & Accounting System
          </h1>
          <p className="hero-description">
            A comprehensive system for managing financial transactions, budgeting, and reporting.
          </p>
          <div className="hero-actions">
            <Button 
              variant="primary" 
              style={{ padding: '0.9rem 2rem', fontSize: '1.1rem' }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Our Features
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="hero-image-container">
          <img 
            src={heroImage} 
            alt="Financial System Illustration Dashboard" 
            className="hero-image"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          
          <h2 className="features-header">
            Key features of our system
          </h2>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-item">
                {/* Icon Circle */}
                <div className="feature-icon-circle">
                  {feature.icon}
                </div>
                
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                
                <p className="feature-description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          <h2 className="about-title">About</h2>
          <p className="about-text">
            Our Finance & Accounting System is designed to streamline your financial processes, 
            providing you with the tools you need to make informed decisions and achieve your financial goals. 
            Built specifically for universities to manage student tuition fees efficiently.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <h2 className="section-title">Contact</h2>
          
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email" 
              className="contact-input"
            />
            <button className="contact-submit-btn">
              Submit
            </button>
          </form>

          <p className="contact-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            info@financeapp.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
