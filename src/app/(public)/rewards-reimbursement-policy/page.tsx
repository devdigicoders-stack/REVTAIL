import Image from "next/image";

export default function RewardsPolicy() {
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
                    <h2 className="fw-700 alt-font text-dark-gray ls-minus-1px mb-0">Rewards & Reimbursement Policy</h2>
                </div>
            </div>  
        </div>
   
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="terms-content">

                        <p>
                            <strong>1. How It Works</strong>
                            <br />
                            Buy → Use → Give Feedback → Get Full Reimbursement → Earn Cash Bonus
                            <br />
                            <strong>2. Purchase Requirements</strong>
                            <br />
                            Purchase the correct product within the campaign period, follow purchase instructions, use an eligible
                            seller where specified, retain valid proof of purchase, and complete all required activities.
                            <br />
                            <strong>3. Reimbursement Amount</strong>
                            <br />
                            The full eligible product purchase amount is reimbursed after successful completion and approval of
                            campaign requirements.
                            <br />
                            <strong>4. Cash Bonus</strong>
                            <br />
                            Every Revtail campaign includes a cash bonus. The bonus amount may vary from campaign to
                            campaign depending on factors such as the product and its purchase price. The applicable bonus is
                            displayed in campaign details.
                            <br />
                            <strong>5. Verification</strong>
                            <br />
                            Revtail may verify purchase details, invoices/receipts, campaign participation, feedback, account
                            information, and other requirements before payout.
                            <br />
                            <strong>6. When a Submission May Be Rejected</strong>
                            <br />
                            Reimbursement/reward may be rejected for wrong product, out-of-period purchase, missing/invalid proof,
                            incomplete requirements, duplicate participation, false information, or fraud.
                            <br />
                            <strong>7. Payout Processing</strong>
                            <br />
                            Approved reimbursement and cash bonuses are processed through the payment method specified for the
                            campaign. Timelines may vary based on verification and payment processing.
                            <br />
                            <strong>8. No Automatic Approval</strong>
                            <br />
                            Participation does not automatically guarantee payout. Eligibility depends on successfully meeting the
                            campaign requirements.
                            <br />
                            <strong>9. Fraud Prevention</strong>
                            <br />
                            Revtail may investigate suspicious activity and suspend or terminate accounts involved in fake receipts,
                            duplicate accounts, manipulated submissions, false information, or other fraudulent activity.
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
