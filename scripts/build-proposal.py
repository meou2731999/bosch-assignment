"""Build the current proposal PDF: uv run --with reportlab python scripts/build-proposal.py."""
from pathlib import Path
from xml.sax.saxutils import escape
import re
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/proposal.md"
OUTPUT = ROOT / "docs/solution-proposal.pdf"
GREEN = colors.HexColor("#173f35")
MUTED = colors.HexColor("#64756c")
styles = getSampleStyleSheet()
styles.add(ParagraphStyle("ProposalTitle", fontName="Helvetica-Bold", fontSize=24,
                          leading=29, textColor=GREEN, spaceAfter=18))
styles.add(ParagraphStyle("ProposalHead", fontName="Helvetica-Bold", fontSize=13,
                          leading=18, textColor=GREEN, spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle("ProposalBody", fontName="Helvetica", fontSize=10,
                          leading=15, spaceAfter=9, alignment=TA_LEFT))

def inline(text):
    text = escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font name='Courier'>\1</font>", text)
    return text

def footer(canvas, doc):
    canvas.saveState()
    width, height = doc.pagesize
    canvas.setFillColor(GREEN)
    canvas.rect(0, height - 8, width, 8, fill=1, stroke=0)
    canvas.setStrokeColor(colors.HexColor("#d9e2d8"))
    canvas.line(44, 43, width - 44, 43)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(44, 29, "REQUEST DESK / AI-ASSISTED ASSESSMENT / 11 OCT 2026")
    canvas.drawRightString(width - 44, 29, str(doc.page))
    canvas.restoreState()

story = []
for block in SOURCE.read_text().strip().split("\n\n"):
    if block == "---":
        story.append(PageBreak())
    elif block.startswith("# "):
        story.append(Paragraph(inline(block[2:]), styles["ProposalTitle"]))
    elif block.startswith("## "):
        story.append(Paragraph(inline(block[3:]), styles["ProposalHead"]))
    elif block.startswith("- "):
        for item in block.splitlines():
            story.append(Paragraph("- " + inline(item[2:]), styles["ProposalBody"]))
    else:
        story.append(Paragraph(inline(block.replace("\n", " ")), styles["ProposalBody"]))
    story.append(Spacer(1, 3))
SimpleDocTemplate(str(OUTPUT), pagesize=(595.28, 841.89), leftMargin=44,
                  rightMargin=44, topMargin=42, bottomMargin=64,
                  title="Request Desk - Solution Proposal", author="AI-assisted assessment").build(
                      story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
