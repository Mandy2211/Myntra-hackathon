import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def create_specification_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor('#831843')     # Deep Rose/Pink
    SECONDARY = colors.HexColor('#0F172A')   # Dark Slate
    ACCENT_EMERALD = colors.HexColor('#059669') # Emerald
    ACCENT_PURPLE = colors.HexColor('#6D28D9')  # Purple
    BG_LIGHT = colors.HexColor('#F8FAFC')    # Light Slate
    TEXT_DARK = colors.HexColor('#1E293B')   # Muted Dark
    BORDER_COLOR = colors.HexColor('#E2E8F0') # Border Gray

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=TA_LEFT,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        alignment=TA_LEFT,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=ACCENT_PURPLE,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6,
        alignment=TA_LEFT
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=TA_LEFT
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK,
        alignment=TA_LEFT
    )

    story = []

    # Document Header / Banner
    story.append(Paragraph("BHARAT AI PLATFORM", title_style))
    story.append(Paragraph("Hyper-Local Fashion E-Commerce Marketplace & MSME Intelligence Engine Specification", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=0, spaceAfter=12))

    # Metadata Box
    meta_data = [
        [Paragraph("<b>Document Version:</b> 1.0 (Production Blueprint)", table_cell_style),
         Paragraph("<b>Date:</b> July 2026", table_cell_style)],
        [Paragraph("<b>Target Audience:</b> Technical Leads, Stakeholders & Auditors", table_cell_style),
         Paragraph("<b>Platform Scope:</b> Customer, Seller & Admin Portals", table_cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[260, 272])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # SECTION 1: EXECUTIVE SUMMARY & ARCHITECTURE
    story.append(Paragraph("1. Executive Summary & Core Architecture", h1_style))
    story.append(Paragraph(
        "<b>Bharat AI</b> is a next-generation hyper-local fashion e-commerce ecosystem specifically engineered for Indian consumers and MSME fashion sellers. "
        "The platform resolves traditional fashion discovery barriers by blending <b>voice & natural language AI</b>, <b>real-time weather/climate intelligence</b>, "
        "and <b>live demand-gap analytics</b> to empower small local sellers while delivering personalized shopping experiences to customers.",
        body_style
    ))

    arch_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technology Stack", table_header_style), Paragraph("Key Functional Role", table_header_style)],
        [Paragraph("<b>Frontend UI</b>", table_cell_style), Paragraph("React.js (Vite), Tailwind CSS, Lucide Icons, Recharts", table_cell_style), Paragraph("Responsive dark/light UI, interactive data charts, speech input", table_cell_style)],
        [Paragraph("<b>Backend API</b>", table_cell_style), Paragraph("Node.js, Express.js REST Framework", table_cell_style), Paragraph("Authentication middleware, search orchestration, AI service integration", table_cell_style)],
        [Paragraph("<b>Database</b>", table_cell_style), Paragraph("PostgreSQL, Prisma ORM", table_cell_style), Paragraph("Relational data management (Users, Products, Purchases, Reviews, Warnings)", table_cell_style)],
        [Paragraph("<b>AI Engine</b>", table_cell_style), Paragraph("Groq API (Llama 3.3 70B, Llama 3.1 8B, Mixtral)", table_cell_style), Paragraph("Zero-shot product attribute auto-tagging, query intent parsing, multilingual summaries", table_cell_style)],
    ]
    arch_table = Table(arch_data, colWidths=[100, 200, 232])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 14))

    # SECTION 2: OPEN SOURCE & FREE APIS USED
    story.append(Paragraph("2. Open-Source & Third-Party APIs / Libraries", h1_style))
    story.append(Paragraph("The platform leverages high-performance open-source tools and free tier APIs to maximize reliability and speed:", body_style))

    api_data = [
        [Paragraph("API / Tool Name", table_header_style), Paragraph("Type / Ecosystem", table_header_style), Paragraph("Rationale & Business Purpose", table_header_style)],
        [Paragraph("<b>Groq Llama 3 API</b>", table_cell_style), Paragraph("Open-Weights LLM Cloud Inference", table_cell_style), Paragraph("Provides ultra-fast (&lt;500ms) LLM inference for product auto-tagging and multi-lingual market analyst summaries across 6 Indian languages.", table_cell_style)],
        [Paragraph("<b>Web Speech API</b>", table_cell_style), Paragraph("Browser Native W3C Standard", table_cell_style), Paragraph("Enables hands-free voice search in Indian regional accents directly in client browsers without audio recording server costs.", table_cell_style)],
        [Paragraph("<b>Prisma ORM</b>", table_cell_style), Paragraph("Open-Source DB Toolkit", table_cell_style), Paragraph("Ensures type-safe SQL query generation, automated database migrations, and clean schema relationships.", table_cell_style)],
        [Paragraph("<b>Recharts</b>", table_cell_style), Paragraph("Open-Source React Visualization", table_cell_style), Paragraph("Renders responsive sales trend lines, category distribution pie charts, and demand gap bar charts in Seller Hub.", table_cell_style)],
        [Paragraph("<b>Lucide React</b>", table_cell_style), Paragraph("Open-Source Icon Set", table_cell_style), Paragraph("Delivers modern, lightweight SVG icons tailored for dark/light mode accessibility.", table_cell_style)],
        [Paragraph("<b>Weather & Climate Context</b>", table_cell_style), Paragraph("JSON Geo-Climate Service", table_cell_style), Paragraph("Supplies real-time city temperature and climate indicators to dynamically filter weather-appropriate fashion shelves.", table_cell_style)]
    ]
    api_table = Table(api_data, colWidths=[130, 140, 262])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 14))

    # SECTION 3: CUSTOMER SIDE FUNCTIONALITIES
    story.append(Paragraph("3. Customer Side Functionalities", h1_style))
    
    story.append(Paragraph("<b>A. Hyper-Local Personalized Homepage & Dynamic Shelves</b>", h2_style))
    story.append(Paragraph("• <b>Weather Shelf:</b> Automatically recommends clothing tailored to live city weather (e.g., lightweight cottons for summer, jackets for monsoon).", bullet_style))
    story.append(Paragraph("• <b>Local Boutiques Shelf:</b> Showcases items from verified local sellers within the user's city/state, marked with a 'Verified Local Seller' badge.", bullet_style))
    story.append(Paragraph("• <b>Budget-Friendly Shelf:</b> Segmented price shelves (Under ₹999, Under ₹1499, Under ₹1999) curated for cost-conscious shoppers.", bullet_style))
    story.append(Paragraph("• <b>Upcoming Festival Shelf:</b> Regional celebration recommendations mapped to active cultural events (e.g., Pongal, Diwali, Onam).", bullet_style))

    story.append(Paragraph("<b>B. Search, Voice AI & Telemetry Engine</b>", h2_style))
    story.append(Paragraph("• <b>Multilingual Voice & Text Input:</b> Integrated mic button utilizing browser speech recognition for natural Indian language search.", bullet_style))
    story.append(Paragraph("• <b>AI Natural Language Intent Parsing:</b> Back-end LLM parses queries into category, gender, color, material, occasion, budget, and exclusions.", bullet_style))
    story.append(Paragraph("• <b>Smart Workplace Suitability Scoring:</b> Ranks office wear queries with a 0-100% Office Score while filtering out inappropriate items.", bullet_style))
    story.append(Paragraph("• <b>Internal Search Telemetry Debugger:</b> Displays real-time JSON intent extraction parameters directly on search results.", bullet_style))

    story.append(Paragraph("<b>C. Order Execution, Reviews & UI Personalization</b>", h2_style))
    story.append(Paragraph("• <b>Mock Buy / Instant Checkout:</b> Complete checkout modal verifying pincode, calculating discounts, deducting stock, and persisting orders to DB.", bullet_style))
    story.append(Paragraph("• <b>Order History & Review System:</b> Customers can view past purchases, leave 1-5 star ratings, write text feedback, and flag complaints.", bullet_style))
    story.append(Paragraph("• <b>Theme & Location Picker:</b> Full Dark/Light mode context toggle and instant city location selector (e.g., Coimbatore, Tamil Nadu).", bullet_style))

    story.append(Spacer(1, 14))

    # SECTION 4: SELLER SIDE FUNCTIONALITIES & MARKET INTELLIGENCE
    story.append(Paragraph("4. Seller Side Functionalities & Growth Hub", h1_style))

    story.append(Paragraph("<b>A. Product Catalog Management & AI Auto-Enrichment</b>", h2_style))
    story.append(Paragraph("• <b>AI-Powered Upload Form:</b> Sellers enter minimal basic fields (Name, Price, Image URL, Stock). The Llama 3 AI service automatically enriches product metadata with Material, Season, Climate Suitability, Ethnic Style, and Confidence score.", bullet_style))
    story.append(Paragraph("• <b>Products Management Table:</b> Full inventory control featuring status toggles (Active / Paused / Out of Stock), remaining stock counters, low-stock warnings, and inline price editing.", bullet_style))

    story.append(Paragraph("<b>B. Market Search Gap Intelligence Cards (Core Feature)</b>", h2_style))
    story.append(Paragraph("The Market Intelligence Hub provides live competitive insights per seller region:", body_style))
    
    gap_data = [
        [Paragraph("Metric / Feature", table_header_style), Paragraph("Implementation & Business Function", table_header_style)],
        [Paragraph("<b>Live Searches Count</b>", table_cell_style), Paragraph("Aggregates real consumer search queries captured in the seller's city/state to measure raw demand volume.", table_cell_style)],
        [Paragraph("<b>Local Supply Count</b>", table_cell_style), Paragraph("Counts existing local products matching those consumer search terms.", table_cell_style)],
        [Paragraph("<b>Opportunity Score (0-100)</b>", table_cell_style), Paragraph("Algorithmically calculated ratio of search demand vs. available supply. Scores &gt; 75 trigger high-demand alerts.", table_cell_style)],
        [Paragraph("<b>Demand Classification Badges</b>", table_cell_style), Paragraph("Visual indicators marking categories as 'HIGH DEMAND' (Green), 'BALANCED' (Blue), or 'SATURATED' (Amber).", table_cell_style)],
        [Paragraph("<b>Search Query Breakdown Modal</b>", table_cell_style), Paragraph("Interactive modal displaying exact search phrases typed by local buyers along with individual query counts.", table_cell_style)],
        [Paragraph("<b>Multilingual AI Analyst Summary</b>", table_cell_style), Paragraph("Groq Llama 3 powered business summary providing actionable stocking advice in <b>6 Indian languages</b> (English, Hindi, Tamil, Telugu, Kannada, Bengali).", table_cell_style)]
    ]
    gap_table = Table(gap_data, colWidths=[160, 372])
    gap_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_PURPLE),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(gap_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>C. Sales Analytics & Category Requests</b>", h2_style))
    story.append(Paragraph("• <b>Revenue & Inventory KPI Cards:</b> 3 primary KPI metrics (Total Revenue ₹, Units Sold, Total Orders) plus a Restock Alert notification banner.", bullet_style))
    story.append(Paragraph("• <b>Visual Trend Analytics:</b> Interactive line chart tracking revenue growth and pie chart illustrating sales distribution by fashion category.", bullet_style))
    story.append(Paragraph("• <b>Category Proposal Form:</b> Allows sellers to request unlisted fashion categories (with seasonal flags, handloom/traditional origin tags, and sample images) for admin approval.", bullet_style))

    story.append(Spacer(1, 14))

    # SECTION 5: ADMIN & PLATFORM GOVERNANCE
    story.append(Paragraph("5. Admin Platform & Governance Capabilities", h1_style))
    story.append(Paragraph("The Admin Console ensures strict catalog moderation, quality control, and regional context management:", body_style))
    
    story.append(Paragraph("• <b>Platform Health Dashboard:</b> High-level KPI overview monitoring Total Platform Revenue, Registered Seller Count, Active Products, and Open Complaints.", bullet_style))
    story.append(Paragraph("• <b>Seller Moderation & Account Controls:</b> View seller profiles, track seller location metadata, and execute Account Block / Unblock actions.", bullet_style))
    story.append(Paragraph("• <b>Formal Seller Warning Issuance:</b> System for admins to issue formal policy warnings (stored in the <code>SellerWarning</code> model) regarding product issues or customer complaints.", bullet_style))
    story.append(Paragraph("• <b>Category Request Approval Workflow:</b> Admin review hub for seller category proposals, allowing one-click Approval or Rejection with feedback comments.", bullet_style))
    story.append(Paragraph("• <b>City Context & Climate Management:</b> Database controls (via <code>CityContext</code>) to configure city climate types, active regional festivals, and style preferences.", bullet_style))

    story.append(Spacer(1, 14))

    # SECTION 6: SUMMARY & VERIFICATION
    story.append(Paragraph("6. Platform Verification Summary", h1_style))
    
    summary_data = [
        [Paragraph("Feature Group", table_header_style), Paragraph("Status", table_header_style), Paragraph("Verification Notes", table_header_style)],
        [Paragraph("<b>Customer Features</b>", table_cell_style), Paragraph("Verified (100%)", table_cell_style), Paragraph("Weather shelf, Budget shelf, Festival shelf, Local Boutiques, Voice search, Checkout, Reviews, Dark/Light mode verified in codebase.", table_cell_style)],
        [Paragraph("<b>Seller Hub & AI Gap Engine</b>", table_cell_style), Paragraph("Verified (100%)", table_cell_style), Paragraph("AI product upload, Gap Cards (Searches, Supply, Opportunity Score, Modal), 6-language summary, KPI cards, Category suggestions verified.", table_cell_style)],
        [Paragraph("<b>Admin Moderation</b>", table_cell_style), Paragraph("Verified (100%)", table_cell_style), Paragraph("Seller block/unblock, formal warning notifications, category approvals, and city climate context controls verified.", table_cell_style)],
    ]
    summary_table = Table(summary_data, colWidths=[140, 100, 292])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_EMERALD),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(summary_table)

    # Build PDF
    doc.build(story)
    print(f"PDF Successfully Generated at: {output_path}")

if __name__ == '__main__':
    target = os.path.join(os.getcwd(), 'Bharat_AI_Platform_Specification.pdf')
    create_specification_pdf(target)
