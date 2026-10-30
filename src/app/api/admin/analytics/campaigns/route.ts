import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({success:false,message:"Unauthorized. Please login."},{status:401});
    if (currentUser.role !== "ADMIN") return NextResponse.json({success:false,message:"Access denied. Admin only."},{status:403});

    const campaigns = await prisma.campaign.findMany({
      where:{status:"COMPLETED"},
      select:{
        id:true, campaignCode:true, productName:true, updatedAt:true,
        brand:{select:{companyName:true}},
      },
      orderBy:{updatedAt:"desc"},
    });

    return NextResponse.json({
      success:true,
      data:campaigns.map(c=>({
        id:c.id,
        campaignCode:c.campaignCode,
        productName:c.productName,
        brandName:c.brand.companyName,
        completedAt:c.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET COMPLETED ANALYTICS CAMPAIGNS ERROR:",error);
    return NextResponse.json({success:false,message:"Unable to load completed campaigns."},{status:500});
  }
}
