import { NextResponse } from 'next/server'

export async function GET() {
    const csvContent = "Name,Email,Company,Phone,LinkedIn,Position,Lead Source,Status,Personalization,Notes,Follow Up Date,Assigned To\n" +
        "Rahul Sharma,rahul@startup.com,GrowthX,9876543210,linkedin.com/in/rahul,Founder,LinkedIn,New,Saw your podcast episode,Interested in SaaS tools,20-03-2026,Ralston\n" +
        "Priya Mehta,priya@agency.in,BrandBoost,9871112233,linkedin.com/in/priya,Marketing Head,Event,Contacted,Loved your recent LinkedIn post,Asked for proposal,22-03-2026,Alex\n"

    const response = new NextResponse(csvContent)
    response.headers.set('Content-Type', 'text/csv')
    response.headers.set('Content-Disposition', 'attachment; filename=crm_lead_template.csv')

    return response
}
