import Image from "next/image";

export default function About() {
return (
<>
<section className="page-title-button-style  ipad-top-space-margin big-section pb-0 md-pt-0 cover-background overflow-hidden"> 
        <div className="container position-relative h-100">
            <div className="position-absolute top-30px left-50px xs-left-10px d-none d-sm-block animation-rotation">
                
                <Image 
                src="/assets/images/demo-data-analysis-bg-011.webp" 
                alt="" 
                width={100}
                height={0}
                sizes="100vw"
                style={{ width: '100px', height: 'auto' }} 
                data-bottom-top="transform: rotate(-50deg) translateY(-50px)" 
                data-top-bottom="transform:rotate(10deg) translateY(50px)" 
                suppressHydrationWarning={true}
                />
            </div> 
            <div className="position-absolute bottom-150px right-50px xs-right-10px d-none d-sm-block animation-rotation">
                <Image 
                    src="/assets/images/demo-data-analysis-bg-011.webp" 
                    alt="" 
                    width={80}
                    height={0}
                    sizes="100vw"
                    style={{ width: '80px', height: 'auto' }}
                    data-bottom-top="transform: rotate(-50deg) translateY(-50px)" 
                    data-top-bottom="transform:rotate(10deg) translateY(50px)" 
                    suppressHydrationWarning={true}
                />
            </div> 
            <div className="row align-items-center justify-content-center extra-small-screen mt-5">
                <div className="col-xl-5 col-lg-6 col-md-7 col-sm-9 position-relative text-center page-title-extra-small" data-anime='{ "el": "childs", "translateY": [30, 0], "opacity": [0,1], "duration": 600, "delay": 0, "staggervalue": 300, "easing": "easeOutQuad" }'>
                    <h1 className="bg-base-color fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px d-inline-block mb-15px">Real Products. Real Experiences. Real Feedback.
</h1>
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">About Revtail</h2>
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">

                        <p>
                            Revtail is a product testing and consumer feedback platform that connects brands with real people who are willing to try products and share their genuine experiences.
                        </p>
                        <p>
                          We believe that the best product insights come from people who actually use products in their everyday lives. That's why we make it simple for consumers to discover products, try them, share honest feedback, and get rewarded for their participation.
                        </p>
                        <p>
                          <strong>What We Do</strong>
                          <br />
                          We create campaigns where eligible consumers can purchase and try selected products. After completing the required campaign activities and sharing their genuine feedback, participants receive full reimbursement for their eligible purchase along with a cash bonus, as specified in the campaign.
                        </p>
                        <p>
                          <strong>Our Approach</strong>
                          <br />
                          <strong>Authentic Feedback</strong>
                          <br />
                          We encourage genuine opinions based on real product experiences.
                          <br /><br />
                          <strong>Simple Participation</strong>
                          <br />
                          Our process is designed to make product testing easy and transparent.
                          <br /><br />
                          <strong>Meaningful Insights</strong>
                          <br />
                          We help brands understand what real consumers think about their products.
                          <br /><br />
                          <strong>Fair Rewards</strong>
                          <br />
                          Eligible participants receive full reimbursement and a cash bonus according to the applicable campaign terms.
                        </p>
                        <p>
                          <strong>Our Mission</strong>
                          <br />
                          Our mission is to build a trusted ecosystem where brands get meaningful consumer insights and consumers get rewarded for sharing their real experiences.
                        </p>
                        <strong>Try it. Experience it. Share it. Get rewarded.</strong>
                    </div>
                </div>
            </div>
        </div>
    </section>
<div className="scroll-progress d-none d-xxl-block">
<a href="#" className="scroll-top" aria-label="scroll">
<span className="scroll-text">Scroll</span><span className="scroll-line"><span className="scroll-point"></span></span>
</a>
</div>
</>
);
}
