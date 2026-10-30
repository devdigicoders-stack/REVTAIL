import Image from "next/image";

export default function WhyChoose() {
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
                    <h1 className="bg-base-color fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px d-inline-block mb-15px">Turn Real Consumer Experiences Into Actionable Insights</h1>
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">Why Choose Us</h2>
                    <p className="mt-2">
                        Your customers are already using your products. We help you understand what they genuinely think.
                    </p>
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">

                        <p>
                            <strong>1. Reach Real Consumers</strong>
                            <br />
                            Connect your products with relevant consumers who can purchase, use, and experience them in real-life
                            situations.
                            <br /><br />
                            <strong>2. Genuine Consumer Feedback</strong>
                            <br />
                            Get authentic opinions based on actual product usage—not assumptions or scripted responses.
                            <br /><br />
                            <strong>3. Targeted Product Campaigns</strong>
                            <br />
                            Run campaigns for specific audiences, locations, demographics, or consumer segments based on your
                            requirements.
                            <br /><br />
                            <strong>4. Valuable Product Insights</strong>
                            <br />
                            Understand what consumers like, what they dont, and what can be improved through structured feedback.
                            <br /><br />
                            <strong>5. Increase Product Discovery</strong>
                            <br />
                            Put your products in front of potential customers and create opportunities for consumers to discover and
                            experience your brand.
                            <br /><br />
                            <strong>6. Simple Campaign Management</strong>
                            <br />
                            Manage campaigns through a streamlined process—from campaign setup and consumer participation to
                            feedback collection.
                            <br /><br />
                            <strong>7. Track Campaign Performance</strong>
                            <br />
                            Get visibility into campaign participation, completed trials, feedback, and other key campaign metrics.
                            <br /><br />
                            <strong>8. Cost-Effective Consumer Research</strong>
                            <br />
                            Conduct product trials and collect consumer insights without the complexity of traditional research methods.
                            <br /><br />
                            <strong>Your Product. Their Experience. Your Insights.</strong>
                            <br />
                            With Revtail, brands dont just reach consumers—they learn from them.
                        </p>
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
