import Image from "next/image";

export default function RefundCancellationPolicy() {
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
                    <h1 className="bg-base-color fw-600 text-white text-uppercase ps-20px pe-20px fs-12 border-radius-100px d-inline-block mb-15px">Last Updated : 04-10-2026</h1>
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">Refund & Cancellation Policy</h2>
                    <p className="mt-2">Revtail (“we”, “us”, or “our”) respects your privacy and is committed to protecting the personal information you share with us.</p>
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">

                        <p>
                            <strong>1. Cancellation Before Purchase</strong>
                            <br />
                            If you have joined a campaign but have not purchased the product, you may cancel participation where the
                            campaign allows it.
                            <br /><br />
                            <strong>2. After Purchasing the Product</strong>
                            <br />
                            Revtail operates a reimbursement model. After an eligible purchase, the participant may receive full
                            reimbursement after successfully completing campaign requirements. Revtail does not itself provide the
                            retailer's product refund.
                            <br /><br />
                            <strong>3. Product Returns</strong>
                            <br />
                            If a participant returns or cancels a product purchase, they may become ineligible for campaign
                            reimbursement and/or cash bonus. Retailer returns are governed by the retailer's own policy.
                            <br /><br />
                            <strong>4. Campaign Cancellation</strong>
                            <br />
                            Revtail or the relevant brand may cancel, pause, modify, or close a campaign for product availability,
                            operational, technical, fraud-prevention, or other reasonable reasons. Reimbursement eligibility will be
                            determined according to the campaign terms and circumstances.
                            <br /><br />
                            <strong>5. Incomplete Participation</strong>
                            <br />
                            If required activities are not completed within the specified timeline, reimbursement or rewards may not be
                            provided.
                            <br /><br />
                            <strong>6. Invalid or Fraudulent Participation</strong>
                            <br />
                            Reimbursement or rewards may be withheld for false information, fake/manipulated receipts, duplicate
                            accounts, multiple submissions, misuse, or other fraudulent activity.
                            <br /><br />
                            <strong>7. Disputes</strong>
                            <br />
                            If you believe a reimbursement or reward was incorrectly rejected, contact Revtail support with the relevant
                            campaign and purchase details for review.
                            <br /><br />
                            <strong>8. Third-Party Product Returns</strong>
                            <br />
                            Revtail does not control third-party seller or brand return, refund, replacement, warranty, shipping, or
                            customer-service policies.
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
