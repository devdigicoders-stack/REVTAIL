import Image from "next/image";

export default function HowWeWork() {
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
                    <h1 className="bg-base-color fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px d-inline-block mb-15px">Try Products. Share Your Experience. Get Rewarded.</h1>
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">How We Work</h2>
                   
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">

                        <p>
                            At Revtail, we make product testing simple and rewarding. You purchase the product, use it in your everyday life, share your genuine feedback, and get your eligible purchase fully reimbursed along with a cash bonus.
                        </p>
                        <p>
                          <strong>Our 5-Step Process</strong>
                          <br />
                        <strong>1. Buy</strong> 
                        <br />
Choose a product from an available campaign and purchase it as instructed.
<br />
<strong>2. Use</strong>
<br />
Use the product genuinely and as you normally would. Take your time to understand your experience with
it.
<br /><br />
<strong>3. Give Feedback</strong>
<br />
Share your honest feedback based on your actual experience. Your opinion helps brands understand what
real customers think about their products.
<br /><br />
<strong>4. Get Reimbursed</strong>
<br />
Once your purchase and feedback meet the campaign requirements, your full eligible purchase amount
will be reimbursed.
<br /><br />
<strong>5. Earn a Cash Bonus</strong>
<br />
Every Revtail campaign includes a cash bonus. The bonus amount may vary depending on the product
and its purchase price.
                        </p>
                      <p>
                        <strong>Simple. Genuine. Rewarding.</strong>
                        <br />
                        <strong>Buy → Use → Give Feedback → Get Reimbursed → Earn Cash Bonus</strong>
                        Every campaign may have its own eligibility criteria, purchase conditions, feedback requirements, reimbursement conditions, and reward amount. Check the campaign details before participating
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
