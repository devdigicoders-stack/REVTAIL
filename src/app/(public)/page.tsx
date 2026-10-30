'use client'
import Link from "next/link";
import { useState } from "react";
const buyerSignals = [
  { num: 1, title: "SATISFACTION SPLIT", desc: "Share of testers satisfied vs dissatisfied, at a glance." },
  { num: 2, title: "AVERAGE RATING", desc: "A single, honest star rating rolled up from every tester." },
  { num: 3, title: "LIKES & DISLIKES", desc: "Tagged by taste, packaging, value, and ease of use — not buried in free text." },
  { num: 4, title: "PURCHASE INTENT", desc: "Would they have bought it anyway? Before-and-after signal, not just hindsight." },
  { num: 5, title: "REPEAT PURCHASE INTENT", desc: "The number that actually predicts retention." },
  { num: 6, title: "PRICE PERCEPTION", desc: "Cheap, fair, or expensive — measured against the product they actually used." },
  { num: 7, title: "PACKAGING FEEDBACK", desc: "Rated separately from the product itself, so you know exactly what to fix." },
  { num: 8, title: "IMPROVEMENT SUGGESTIONS", desc: "Direct, unprompted suggestions from people who paid for and used the product." },
  { num: 9, title: "DEMOGRAPHIC BREAKDOWN", desc: "Age group, gender, and location — so you know who's actually responding." },
  { num: 10, title: "RAW COMMENTS", desc: "Every open-ended response, unedited, in the tester's own words." },
  { num: 11, title: "SENTIMENT ANALYSIS", desc: "Comments scored automatically, so tone is visible without reading every line." },
  { num: 12, title: "ONE FINAL REPORT", desc: "Delivered when the campaign completes — built to guide your next move." },
];

export default function Home() {

  const [activeTab, setActiveTab] = useState('testers');

  const toggleMode = (target: string) => {
    setActiveTab(target);
  };
  
  return (
    <>
      <main className="revtail-main-wrapper">
  <div className="container text-center">

   
    <div className="revtail-toggle-box" style={{ marginTop: '36px', marginBottom: '24px' }}>
      <button
        type="button"
        className={`revtail-toggle-btn ${activeTab === 'testers' ? 'active-btn' : ''}`}
        id="btn-tester"
        onClick={() => toggleMode('testers')}
      >
        For Testers
      </button>

      <button
        type="button"
        className={`revtail-toggle-btn ${activeTab === 'brands' ? 'active-btn' : ''}`}
        id="btn-brand"
        onClick={() => toggleMode('brands')}
      >
        For Brands
      </button>
    </div>

   
    <div
        id="panel-testers"
        className={`panel ${activeTab === 'testers' ? 'active-panel' : ''}`}
        style={{ display: activeTab === 'testers' ? 'block' : 'none' }}
      >
      
      <div className="row align-items-center text-start my-4 g-4">
        <div className="col-lg-6">
          <div className="d-inline-block bg-cabaret-red fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px mb-20px">
            Get paid to try real products
          </div>
            <h1 className="alt-font text-dark-gray fw-700 mb-20px hero-title" style={{ letterSpacing: "-0.01em" }}>
            Try it first. <br />
            Say what you think. <br />
            Get paid for it.
            </h1> 
          <p className="alt-font fs-18 text-muted mb-35px">
            Claim free full-sized products from leading D2C brands, test them at home, share your honest feedback, and earn rewards instantly.
          </p>
          <a
            href="/tester/signup"
            className="btn btn-textclr btn-extra-large btn-hover-animation-switch btn-round-edge btn-box-shadow me-25px"
            style={{ backgroundColor: "#012977", borderColor: "#012977", color: "#ffffff" }}
          >
            <span> 
                <span className="btn-text">Join as a Tester</span>
                <span className="btn-icon"><i className="feather icon-feather-arrow-right"></i></span>
                <span className="btn-icon"><i className="feather icon-feather-arrow-right"></i></span>
            </span>
          </a>
        </div>
        <div className="col-lg-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/hero.jpg" className="img-fluid rounded-4 shadow-sm" alt="Tester Dashboard" />
        </div>
      </div>

      <section className="py-4 py-lg-5">
<div className="container position-relative">
    <div className="row align-items-center mb-5">
        <div className="col-12 col-lg-5 text-center text-lg-start mb-4 mb-lg-0">
            <span className="pe-25px mb-20px text-uppercase text-base-color fs-14 lh-42px fw-700 border-radius-100px bg-gradient-very-light-gray-transparent d-inline-block">How it Works</span>
            <h3 className="text-dark-gray fw-700 mb-4" style={{ letterSpacing: "-0.01em" }}>Four simple steps, from purchase to payout</h3>
           <div className="row row-cols-1">
               
                <div className="col-12 process-step-style-05 position-relative hover-box">
                    <div className="process-step-item d-flex">
                        <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">01</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>
                            </div>
                            <span className="progress-step-separator bg-dark-gray opacity-1"></span>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin mb-30px">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Buy & prove it</span>
                            <p className="w-90 lg-w-100 lh-32">Purchase the product yourself and submit your order ID and amount.</p>
                        </div>
                    </div>
                </div>
               
                <div className="col-12 process-step-style-05 position-relative hover-box">
                    <div className="process-step-item d-flex">
                        <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">02</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>
                            </div>
                            <span className="progress-step-separator bg-dark-gray opacity-1"></span>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin mb-30px">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Show it arrived</span>
                            <p className="w-90 lg-w-100 lh-32">Share delivery proof and a photo of you using the product.</p>
                        </div>
                    </div>
                </div>
             
                <div className="col-12 process-step-style-05 position-relative hover-box xs-mb-30px">
                    <div className="process-step-item d-flex">
                       <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">03</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>
                            </div>
                            <span className="progress-step-separator bg-dark-gray opacity-1"></span>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Say what you think</span>
                            <p className="w-90 lg-w-100 lh-32">Fill a short feedback form — rating, likes, dislikes, etc.</p>
                        </div>
                    </div>
                </div>
              
                <div className="col-12 process-step-style-05 position-relative hover-box xs-mb-30px">
                    <br />
                    <div className="process-step-item d-flex">
                        <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">04</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>

                            </div>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Get paid</span>
                            <p className="w-90 lg-w-100 lh-32">Once approved, your review goes live and your payout is released.</p>
                        </div>
                    </div>
                </div>
           
            </div>
        </div>
        <div className="col-12 col-lg-7 position-relative mb-4 mb-lg-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/home-how-it-works.png" className="position-relative z-index-9 top-40px img-fluid" alt="How it works" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/demo-corporate-03.png" className="absolute-middle-center xs-w-95" alt="Demo Corporate" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/cloud.webp" className="position-absolute top-50px left-0px xs-left-15px"
                 data-bottom-top="transform: translateY(-50px)" data-top-bottom="transform: translateY(50px)"
                 alt="Cloud" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/cloud1.webp" className="position-absolute top-150px left-30"
                 data-bottom-top="transform: translateY(30px)" data-top-bottom="transform: translateY(-30px)"
                 alt="Cloud 1" />
           
        </div>
    </div>
    
</div>
</section>


<section className="section-campaigns">
  <div className="container-fluid">
    <div className="row align-items-center g-4 g-lg-5">
      <div className="col-lg-6" data-aos="fade-left" data-aos-duration="800">
        <div className="position-relative">
         
         
          <div className="campaign-note d-lg-none text-center mb-3" data-aos="fade-up">
            Your interests. Your campaigns.
            <span className="arrow">↓</span>
          </div>

          <div className="product-grid">
            <div className="product-card" data-aos="zoom-in" data-aos-delay="100">
              
              {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop" alt="Beauty products" />
            </div>
            <div className="product-card" data-aos="zoom-in" data-aos-delay="150">
              {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" alt="Food bowl" />
            </div>
            <div className="product-card" data-aos="zoom-in" data-aos-delay="200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop" alt="Skincare bottles" />
            </div>
            <div className="product-card" data-aos="zoom-in" data-aos-delay="250">
              {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop" alt="Smartwatch" />
            </div>
            <div className="product-card" data-aos="zoom-in" data-aos-delay="300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop" alt="Sneakers" />
            </div>
            <div className="product-card" data-aos="zoom-in" data-aos-delay="350">
              {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop" alt="Supplement bottle" />
            </div>
          </div>
        </div>
      </div>

     
      <div className="col-lg-6" data-aos="fade-right" data-aos-duration="800">
        <h2 className="section-title" data-aos="fade-up" data-aos-delay="100" style={{ textAlign: 'left' }}>
          Find Campaigns Made for You
        </h2>
        <p className="section-subtitle" data-aos="fade-up" data-aos-delay="200">
          Your interests help us match you with the right opportunities. 
          Choose from a wide range of categories and discover products you'll actually love.
        </p>

        <div className="category-pills" data-aos="fade-up" data-aos-delay="300">
          <a href="#" className="category-pill">
            <i className="bi bi-palette"></i> Beauty
          </a>
          <a href="#" className="category-pill">
            <i className="bi bi-heart"></i> Personal Care
          </a>
          <a href="#" className="category-pill">
            <i className="bi bi-cup-straw"></i> Food & Beverage
          </a>
          <a href="#" className="category-pill">
            <i className="bi bi-house"></i> Home
          </a>
          <a href="#" className="category-pill">
            <i className="bi bi-bag"></i> Fashion
          </a>
          <a href="#" className="category-pill">
            <i className="bi bi-cpu"></i> Electronics
          </a>
          <a href="#" className="category-pill">
            <i className="bi bi-heart-pulse"></i> Health & Wellness
          </a>
          <a href="#" className="category-pill">
            <i className="bi bi-three-dots"></i> More
          </a>
        </div>
      </div>

    </div>
  </div>
</section>



<div className="banner-container">
  <div className="banner-content">
    <h2 className="banner-title text-white">Ready to try your first product?</h2>
    <p className="banner-subtitle">Sign up as a tester and get matched with a product to try, review, and get paid.</p>
    <a href="/tester/signup" className="banner-btn">Start testing products</a>
  </div>
</div>

  
    </div>


  
   <div
        id="panel-brands"
        className={`panel ${activeTab === 'brands' ? 'active-panel' : ''}`}
        style={{ display: activeTab === 'brands' ? 'block' : 'none' }}
      >
      <div className="row align-items-center text-start my-4 g-4">
        <div className="col-lg-6">
          <div className="d-inline-block bg-brand-green fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px mb-20px">
            Consumer testing, not just testimonials
          </div>
          <h1 className="alt-font text-dark-gray fw-700 mb-20px hero-title" style={{ letterSpacing: "-0.01em" }}>
            Real consumers, <br />
            Real feedback. <br />
            Real data.
          </h1> 
          <p className="alt-font fs-18 text-muted mb-35px">
            Revtail puts your product in front of real Indian buyers, then turns what they say into a report you can actually use — satisfaction, purchase intent, sentiment, and more.
          </p>
          <a
            href="/brand/signup"
            className="btn btn-extra-large btn-textclr btn-hover-animation-switch btn-round-edge btn-box-shadow me-25px"
            style={{ backgroundColor: "#012977", borderColor: "#012977", color: "#ffffff" }}
          >
            <span> 
                <span className="btn-text">List your product</span>
                <span className="btn-icon"><i className="feather icon-feather-arrow-right"></i></span>
                <span className="btn-icon"><i className="feather icon-feather-arrow-right"></i></span>
            </span>
          </a>
        </div>
        <div className="col-lg-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/brandshome.png" className="img-fluid rounded-4 shadow-sm" alt="Brand Analytics Dashboard" />
        </div>
      </div>



      
      <div className="row align-items-center text-start my-4 g-4">
<div className="container position-relative">
    <div className="row align-items-center mb-5">
        <div className="col-12 col-lg-5 text-center text-lg-start mb-4 mb-lg-0">
            <span className="ps-25px pe-25px mb-20px text-uppercase text-base-color fs-14 lh-42px fw-700 border-radius-100px bg-gradient-very-light-gray-transparent d-inline-block">Our Business Process</span>
            <h3 className="text-dark-gray fw-700 mb-4" style={{ letterSpacing: "-0.01em" }}>How it Works</h3>
           <div className="row row-cols-1">
                
                <div className="col-12 process-step-style-05 position-relative hover-box">
                    <div className="process-step-item d-flex">
                        <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">01</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>
                            </div>
                            <span className="progress-step-separator bg-dark-gray opacity-1"></span>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin mb-30px">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Purchase, verified</span>
                            <p className="w-90 lg-w-100 lh-32">The tester buys your product and submits order ID and amount as proof.</p>
                        </div>
                    </div>
                </div>
             
                <div className="col-12 process-step-style-05 position-relative hover-box">
                    <div className="process-step-item d-flex">
                        <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">02</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>
                            </div>
                            <span className="progress-step-separator bg-dark-gray opacity-1"></span>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin mb-30px">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Delivery, confirmed</span>
                            <p className="w-90 lg-w-100 lh-32">Delivery proof and an in-use photo are logged before feedback begins.</p>
                        </div>
                    </div>
                </div>
                
                <div className="col-12 process-step-style-05 position-relative hover-box xs-mb-30px">
                    <div className="process-step-item d-flex">
                       <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">03</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>
                            </div>
                            <span className="progress-step-separator bg-dark-gray opacity-1"></span>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Feedback, structured</span>
                            <p className="w-90 lg-w-100 lh-32">A short form captures rating, satisfaction, likes and dislikes, price perception, and open comments.</p>
                        </div>
                    </div>
                </div>
               
                <div className="col-12 process-step-style-05 position-relative hover-box xs-mb-30px">
                    <div className="process-step-item d-flex">
                        <div className="process-step-icon-wrap position-relative">
                            <div className="process-step-icon d-flex justify-content-center align-items-center mx-auto rounded-circle h-60px w-60px fs-14 bg-light-red fw-700 position-relative">
                                <span className="number position-relative z-index-1 text-dark-gray">04</span>
                                <div className="box-overlay bg-base-color rounded-circle"></div>

                            </div>
                        </div>
                        <div className="process-content ps-30px last-paragraph-no-margin">
                            <span className="d-block fw-700 text-dark-gray mb-5px fs-18">Review, published</span>
                            <p className="w-90 lg-w-100 lh-32">Once you approve it, the review goes live. </p>
                        </div>
                    </div>
                </div>
               

            </div>
        </div>
        <div className="col-12 col-lg-7 position-relative mb-4 mb-lg-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/how-we-work.png" className="position-relative z-index-9 top-40px img-fluid" alt="How we work" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/demo-corporate-03.png" className="absolute-middle-center xs-w-95" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/cloud.webp" className="position-absolute top-50px left-0px xs-left-15px"
                 data-bottom-top="transform: translateY(-50px)" data-top-bottom="transform: translateY(50px)"
                 alt="Cloud" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/assets/images/cloud1.webp" className="position-absolute top-150px left-30"
                 data-bottom-top="transform: translateY(30px)" data-top-bottom="transform: translateY(-30px)"
                 alt="" />
           
        </div>
    </div>
    
</div>
</div>

    
      


    
      <div className="row justify-content-center mb-2">
        <div className="col-xxl-6 col-xl-7 col-lg-8 col-md-9 text-center">
          <div
            className="fw-600 text-white text-uppercase px-3 py-1 fs-12 rounded-pill d-inline-block mb-15px"
            style={{ backgroundColor: "#012977", letterSpacing: "0.05em" }}
          >
            What Brands Get Back
          </div>
          <h2 className="fw-700 alt-font text-dark-gray" style={{ letterSpacing: "-0.01em" }}>
            One report. Twelve live buyer signals.
          </h2>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 text-start g-4 mt-4 mb-5">
        {buyerSignals.map((item) => (
          <div className="col" key={item.num}>
            <div
              className="h-100 p-4 d-flex flex-column"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center text-white fw-bold mb-3"
                style={{
                  width: "40px",
                  height: "40px",
                  minWidth: "40px",
                  minHeight: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#012977",
                  fontSize: "15px",
                  boxShadow: "0 2px 6px rgba(1, 41, 119, 0.25)",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {item.num}
              </div>
              <h5
                className="fw-bold mb-2"
                style={{
                  fontSize: "15px",
                  color: "#012977",
                  letterSpacing: "0.02em",
                  lineHeight: 1.35,
                }}
              >
                {item.title}
              </h5>
              <p
                className="text-muted mb-0"
                style={{
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                }}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

     
      <div className="banner-container">
  <div className="banner-content">
    <h2 className="banner-title text-white">Ready to see what your customers really think?</h2>
    <p className="banner-subtitle">Send us your product and get a sample report back before you commit to anything.</p>
    <a href="/brand/signup" className="banner-btn">List your product</a>
  </div>
</div>



    </div>
   
  </div>
</main>
    </>
  );
}
