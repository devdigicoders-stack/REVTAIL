import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext={params:Promise<{id:string}>};
type Counter=Map<string,number>;

function parseAnswer(value:string|null|undefined):string[]{
  if(!value) return [];
  try{
    const parsed=JSON.parse(value);
    if(Array.isArray(parsed)) return parsed.filter((x):x is string=>typeof x==="string").map(x=>x.trim()).filter(Boolean);
  }catch{}
  const cleaned=value.trim();
  return cleaned?[cleaned]:[];
}
function formatAgeCategory(value:string|null){
  if(!value) return "Unknown";
  if(value==="AGE_18_24") return "18-24";
  if(value==="AGE_25_34") return "25-34";
  if(value==="AGE_35_44") return "35-44";
  if(value==="AGE_45_PLUS") return "45+";
  return value;
}
function increment(counter:Counter,key:string){ counter.set(key,(counter.get(key)??0)+1); }
function distribution(counter:Counter,denominator:number,sortByCount=false){
  const out=Array.from(counter.entries()).map(([label,count])=>({label,count,percentage:denominator>0?Number(((count/denominator)*100).toFixed(1)):0}));
  if(sortByCount) out.sort((a,b)=>b.count-a.count);
  return out;
}

export async function GET(_request:Request,context:RouteContext){
  try{
    const currentUser=await getCurrentUser();
    if(!currentUser) return NextResponse.json({success:false,message:"Unauthorized. Please login."},{status:401});
    if(currentUser.role!=="ADMIN") return NextResponse.json({success:false,message:"Access denied. Admin only."},{status:403});

    const {id}=await context.params;
    const campaignId=Number(id);
    if(!Number.isInteger(campaignId)||campaignId<=0) return NextResponse.json({success:false,message:"Invalid campaign ID."},{status:400});

    const campaign=await prisma.campaign.findUnique({
      where:{id:campaignId},
      select:{
        id:true,campaignCode:true,productName:true,status:true,updatedAt:true,
        brand:{select:{companyName:true}},
        campaignQuestions:{
          orderBy:{questionOrder:"asc"},
          select:{
            id:true,questionText:true,questionType:true,source:true,
            question:{select:{options:{orderBy:{optionOrder:"asc"},select:{optionText:true,optionOrder:true}}}},
          },
        },
      },
    });

    if(!campaign) return NextResponse.json({success:false,message:"Campaign not found."},{status:404});
    if(campaign.status!=="COMPLETED") return NextResponse.json({success:false,message:"Analytics are available only for completed campaigns."},{status:409});

    const testerCampaigns=await prisma.testerCampaign.findMany({
      where:{campaignId,status:"COMPLETED"},
      select:{
        id:true,
        testerProfile:{select:{gender:true,ageCategory:true,city:true}},
        tasks:{
          where:{taskNumber:3},take:1,
          select:{
            id:true,
            submissions:{
              where:{status:"APPROVED"},orderBy:{submittedAt:"desc"},take:1,
              select:{
                id:true,
                task3ReviewDetail:{
                  select:{
                    rating:true,
                    answers:{select:{answerText:true,campaignQuestion:{select:{id:true,questionText:true,questionType:true,source:true}}}},
                  },
                },
              },
            },
          },
        },
      },
    });

    const completedTesters=testerCampaigns.length;
    const genderCounter:Counter=new Map();
    const ageCounter:Counter=new Map();
    const cityCounter:Counter=new Map();
    for(const tc of testerCampaigns){
      const p=tc.testerProfile;
      increment(genderCounter,p.gender||"Unknown");
      increment(ageCounter,formatAgeCategory(p.ageCategory));
      increment(cityCounter,p.city?.trim()||"Unknown");
    }

    const ratings:number[]=[];
    const questionAnswers=new Map<number,string[][]>();
    for(const tc of testerCampaigns){
      const review=tc.tasks[0]?.submissions[0]?.task3ReviewDetail;
      if(!review) continue;
      if(Number.isInteger(review.rating)&&review.rating>=1&&review.rating<=5) ratings.push(review.rating);
      for(const answer of review.answers){
        const qid=answer.campaignQuestion.id;
        const values=parseAnswer(answer.answerText);
        const existing=questionAnswers.get(qid)??[];
        existing.push(values);
        questionAnswers.set(qid,existing);
      }
    }

    const ratingCounts=new Map<number,number>([[1,0],[2,0],[3,0],[4,0],[5,0]]);
    for(const r of ratings) ratingCounts.set(r,(ratingCounts.get(r)??0)+1);
    const averageRating=ratings.length?Number((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2)):null;
    const ratingDistribution=Array.from(ratingCounts.entries()).map(([rating,count])=>({rating,count,percentage:ratings.length?Number(((count/ratings.length)*100).toFixed(1)):0}));

    const formattedQuestions=campaign.campaignQuestions.map(q=>{
      const respondentAnswers=questionAnswers.get(q.id)??[];
      const responseCount=respondentAnswers.filter(v=>v.length>0).length;
      const optionCounter:Counter=new Map();
      const configuredOptions=q.question?.options?.map(o=>o.optionText)??[];
      for(const option of configuredOptions) optionCounter.set(option,0);
      for(const values of respondentAnswers) for(const value of values) optionCounter.set(value,(optionCounter.get(value)??0)+1);
      const options=Array.from(optionCounter.entries()).map(([label,count])=>({label,count,percentage:responseCount?Number(((count/responseCount)*100).toFixed(1)):0}));
      return {id:q.id,questionText:q.questionText,questionType:q.questionType,source:q.source,responseCount,options};
    });

    return NextResponse.json({
      success:true,
      data:{
        campaign:{id:campaign.id,campaignCode:campaign.campaignCode,productName:campaign.productName,brandName:campaign.brand.companyName,status:campaign.status,completedAt:campaign.updatedAt.toISOString()},
        summary:{completedTesters,ratedTesters:ratings.length,averageRating},
        rating:{average:averageRating,totalRatings:ratings.length,distribution:ratingDistribution},
        gender:distribution(genderCounter,completedTesters),
        ageGroups:distribution(ageCounter,completedTesters),
        topCities:distribution(cityCounter,completedTesters,true).slice(0,8),
        fixedQuestions:formattedQuestions.filter(q=>q.source==="FIXED"),
        brandQuestions:formattedQuestions.filter(q=>q.source!=="FIXED"),
      },
    });
  }catch(error){
    console.error("GET CAMPAIGN ANALYTICS ERROR:",error);
    return NextResponse.json({success:false,message:"Unable to load campaign analytics."},{status:500});
  }
}
