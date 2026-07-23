from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "openai-5-6-usage-software-mri.pdf"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#d9e2ea"))
    canvas.line(0.7 * inch, 0.55 * inch, 7.8 * inch, 0.55 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(0.7 * inch, 0.35 * inch, "Software MRI - OpenAI GPT-5.6 Usage Summary")
    canvas.drawRightString(7.8 * inch, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


def p(text, style):
    return Paragraph(text, style)


def bullet(text, style):
    return Paragraph(f'<font color="#0f6b78">-</font> {text}', style)


def build():
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=29,
        textColor=colors.HexColor("#0b1f2a"),
        alignment=TA_CENTER,
        spaceAfter=12,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=11,
        leading=16,
        textColor=colors.HexColor("#475467"),
        alignment=TA_CENTER,
        spaceAfter=22,
    )
    h = ParagraphStyle(
        "HeadingCustom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0b1f2a"),
        spaceBefore=14,
        spaceAfter=8,
    )
    body = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15.5,
        textColor=colors.HexColor("#344054"),
        alignment=TA_LEFT,
        spaceAfter=8,
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#475467"),
    )
    table_head = ParagraphStyle(
        "TableHead",
        parent=small,
        fontName="Helvetica-Bold",
        fontSize=8.7,
        leading=11,
        textColor=colors.white,
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=small,
        fontSize=8.1,
        leading=10.5,
        textColor=colors.HexColor("#344054"),
    )
    callout = ParagraphStyle(
        "Callout",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=15.5,
        textColor=colors.HexColor("#0b1f2a"),
        backColor=colors.HexColor("#eef9fb"),
        borderColor=colors.HexColor("#98d8e3"),
        borderWidth=0.8,
        borderPadding=9,
        spaceAfter=12,
    )

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        rightMargin=0.7 * inch,
        leftMargin=0.7 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.75 * inch,
        title="OpenAI GPT-5.6 Usage Summary - Software MRI",
        author="Software MRI",
    )

    story = []
    story.append(p("How I Used OpenAI GPT-5.6 to Build Software MRI", title))
    story.append(
        p(
            "A concise project-submission summary describing how GPT-5.6 supported design iteration, frontend implementation, backend engineering, and visual assets.",
            subtitle,
        )
    )
    story.append(
        p(
            "Project: <b>Software MRI</b> - a static-analysis web app that takes a public GitHub repository URL, scans the codebase, and visualizes structure, complexity, dependency risk, and technical debt as an interactive diagnostic graph.",
            callout,
        )
    )

    story.append(p("Summary", h))
    story.append(
        p(
            "I used OpenAI GPT-5.6 as a practical engineering and design partner throughout the project. The model helped me move from a raw idea - an MRI-style scan for codebases - into a polished, working product with a professional UI, a real backend analysis pipeline, and submission-ready visual material.",
            body,
        )
    )
    story.append(
        p(
            "The strongest use of the model was not a single prompt. I used it iteratively: asking for improvements, reviewing the result, refining the product direction, and repeating that cycle until the frontend, backend, and presentation assets felt cohesive.",
            body,
        )
    )

    story.append(p("Where GPT-5.6 Was Used", h))
    raw_rows = [
        ["Area", "How I used GPT-5.6", "Result"],
        [
            "Idea brainstorming",
            "Used GPT-5.6 early in the process to brainstorm and sharpen the Software MRI concept before implementation.",
            "The product direction became clearer: a diagnostic scan for repositories instead of a generic code dashboard.",
        ],
        [
            "Frontend UI",
            "Used GPT-5.6 with Figma to explore layouts, interaction states, visual hierarchy, and repeated UI refinements.",
            "A polished scanner-style interface with a strong visual identity and clear diagnostic workflow.",
        ],
        [
            "Frontend iteration",
            "Repeatedly prompted the model to improve spacing, typography, visual balance, component behavior, and the scan-result experience.",
            "The UI evolved from an early concept into a more professional, demo-ready product.",
        ],
        [
            "Backend engineering",
            "Used Codex/GPT-5.6 in another chat to implement the backend that receives a GitHub repo link, clones/fetches the repo, scans files, analyzes dependencies, and returns structured results to the frontend.",
            "An end-to-end backend pipeline capable of supporting the main product demo.",
        ],
        [
            "Static-analysis flow",
            "Used GPT-5.6 to reason through the analysis stages: repo fetching, file enumeration, dependency graph creation, complexity scoring, debt findings, and deterministic diagnosis text.",
            "A backend result format that feeds the graph, metrics, risk list, and diagnosis panel.",
        ],
        [
            "Video and project thumbnails",
            "Used GPT-5.6 to create and refine the YouTube video thumbnail and the project thumbnail.",
            "Submission assets matched the product's diagnostic, high-tech visual direction.",
        ],
    ]
    rows = []
    for row_index, row in enumerate(raw_rows):
        style = table_head if row_index == 0 else table_cell
        rows.append([p(cell, style) for cell in row])
    table = Table(rows, colWidths=[1.25 * inch, 3.05 * inch, 2.45 * inch], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b1f2a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.7),
                ("LEADING", (0, 0), (-1, -1), 11.5),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#344054")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d0d5dd")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#fbfdff")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(table)

    story.append(p("Frontend Design Process", h))
    for item in [
        "I used GPT-5.6 while working with Figma to shape the visual language of Software MRI: a dark diagnostic console, MRI-inspired scan lines, high-contrast risk colors, and a clear codebase-analysis workflow.",
        "The model helped me iterate on the UI multiple times instead of settling for the first design. I refined the hero/workspace, repository input, scanning state, graph panel, diagnosis panel, metric cards, and debt layer.",
        "GPT-5.6 also helped me keep the interface focused on the actual product experience rather than a generic landing page. The first screen is the usable scanner, which better matches the purpose of the tool.",
    ]:
        story.append(bullet(item, body))

    story.append(p("Backend and Product Logic", h))
    for item in [
        "In a separate Codex chat, GPT-5.6 helped code the backend needed for the product to work end to end.",
        "The backend accepts a GitHub repository link, validates it, clones/fetches the public repository, scans JavaScript and TypeScript files, builds a dependency graph, calculates complexity signals, detects technical-debt indicators, and returns JSON that the frontend can render.",
        "This made the project more than a static mockup. The app is built around a real analysis flow where the UI responds to actual repository data.",
    ]:
        story.append(bullet(item, body))

    story.append(p("Idea Development", h))
    story.append(
        p(
            "Before building the interface and backend, I used GPT-5.6 to brainstorm the core idea for Software MRI. That helped turn a broad interest in code analysis into a more memorable product concept: an MRI-like scan that makes repository structure, risk, and technical debt visible at a glance.",
            body,
        )
    )
    story.append(
        p(
            "This early brainstorming step mattered because it gave the rest of the project a clear direction. The visual design, backend scan pipeline, graph metaphor, and final submission story all came from that central diagnostic framing.",
            body,
        )
    )

    story.append(p("Asset Creation and Submission Material", h))
    story.append(
        p(
            "I also used GPT-5.6 to create the visual assets needed to present the project professionally. This included the YouTube video thumbnail and the project thumbnail. The goal was to make the submission immediately communicate the product idea: a serious diagnostic scan for software repositories.",
            body,
        )
    )

    story.append(p("Why This Was a Strong Use of GPT-5.6", h))
    for item in [
        "I used the model across multiple parts of the build: product thinking, UI design, frontend refinement, backend implementation, and launch assets.",
        "The workflow was iterative. I did not only ask for a single output; I used GPT-5.6 repeatedly to improve the product based on what was missing or unclear.",
        "The final app combines design quality with working engineering: repo input, backend fetching, file scanning, dependency analysis, metrics, graph visualization, and a deterministic diagnosis panel.",
        "GPT-5.6 helped me build faster as a solo developer while still keeping the project coherent and demoable.",
    ]:
        story.append(bullet(item, body))

    story.append(p("Final Statement", h))
    story.append(
        p(
            "OpenAI GPT-5.6 was central to how I built Software MRI. I used it to brainstorm and sharpen the original idea, turn the concept into a professional frontend through repeated Figma/UI iterations, build the backend analysis system in Codex, and create polished thumbnail assets for the video and project submission. The model helped me cover product thinking, design, engineering, and presentation work at a level that would have been difficult to complete alone in the same amount of time.",
            body,
        )
    )

    story.append(Spacer(1, 0.12 * inch))
    story.append(
        p(
            "Prepared for Devpost submission upload. No credentials are included in this document.",
            small,
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build()
