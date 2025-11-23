import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  useEffect(() => {
    // Hero animations
    gsap.to('.hero h1', {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: 0.5,
      ease: 'power2.out'
    });

    gsap.to('.hero p', {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: 0.8,
      ease: 'power2.out'
    });

    gsap.to('.cta-button', {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: 1.1,
      ease: 'power2.out'
    });

    // Feature animations with scroll trigger
    gsap.utils.toArray('.feature-item').forEach((item, index) => {
      gsap.to(item, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      });
    });
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1>Next-Gen Project Management</h1>
        <p>Experience the future of collaboration with AI-powered insights, advanced analytics, and seamless team coordination</p>
        <Link to="/register">
          <button className="cta-button">Start Your Journey</button>
        </Link>
      </section>

      <section className="features">
        <h2>Revolutionary Features</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <h3>AI-Powered Task Assignment</h3>
            <p>Smart algorithms automatically suggest task assignments based on team member skills and workload.</p>
          </div>
          <div className="feature-item">
            <h3>Advanced Analytics Dashboard</h3>
            <p>Get deep insights into project performance with predictive analytics and custom reporting.</p>
          </div>
          <div className="feature-item">
            <h3>Real-time Collaboration</h3>
            <p>Work together seamlessly with live editing, instant messaging, and collaborative document sharing.</p>
          </div>
          <div className="feature-item">
            <h3>Intelligent Notifications</h3>
            <p>Smart notification system that learns your preferences and delivers only relevant updates.</p>
          </div>
          <div className="feature-item">
            <h3>Time Tracking & Budgeting</h3>
            <p>Built-in time tracking with budget monitoring and resource allocation optimization.</p>
          </div>
          <div className="feature-item">
            <h3>Integration Ecosystem</h3>
            <p>Connect with 200+ tools including GitHub, Slack, Jira, and more for a unified workflow.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
