#!/usr/bin/env python3
"""G-P1 CV generator. Single bilingual JSON source for web, PDF and DOCX.

Dependencies for generation: reportlab, python-docx, pypdf.
Run: python tools/generate-portfolio-resumes.py [--check]
"""
from __future__ import annotations

import json
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "apps/web/lib/portfolio-profile.json"
OUTPUT = ROOT / "apps/web/public/resume"


def read_profile():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    assert data["en"]["projects"][0]["name"] == "Galaxiora"
    assert data["uk"]["projects"][0]["name"] == "Galaxiora"
    return data


def name_for(locale, extension):
    return OUTPUT / f"denys-avramenko-cv.{locale}.{extension}"


def generate_pdf(locale, profile):
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

    c, p = profile["contact"], profile[locale]
    regular = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    bold = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    if not (regular.exists() and bold.exists()):
        raise RuntimeError("DejaVu Sans font required. Install fonts-dejavu-core.")
    pdfmetrics.registerFont(TTFont("CVDejaVu", str(regular)))
    pdfmetrics.registerFont(TTFont("CVDejaVu-Bold", str(bold)))
    pdfmetrics.registerFontFamily("CVDejaVu", normal="CVDejaVu", bold="CVDejaVu-Bold")
    style = {
        "name": ParagraphStyle("Name", fontName="CVDejaVu-Bold", fontSize=20, leading=23, textColor=colors.HexColor("#15263F"), spaceAfter=5),
        "title": ParagraphStyle("Role", fontName="CVDejaVu-Bold", fontSize=10.5, leading=15, textColor=colors.HexColor("#385577"), spaceAfter=10),
        "normal": ParagraphStyle("Normal", fontName="CVDejaVu", fontSize=8.5, leading=12.7, textColor=colors.HexColor("#243347"), spaceAfter=5),
        "small": ParagraphStyle("Small", fontName="CVDejaVu", fontSize=8, leading=12, textColor=colors.HexColor("#35485F"), spaceAfter=6),
        "head": ParagraphStyle("Head", fontName="CVDejaVu-Bold", fontSize=10, leading=14, textColor=colors.HexColor("#284367"), spaceBefore=13, spaceAfter=6),
        "job": ParagraphStyle("Job", fontName="CVDejaVu-Bold", fontSize=9, leading=13, textColor=colors.HexColor("#172D47"), spaceBefore=4, spaceAfter=4),
        "bullet": ParagraphStyle("Bullet", fontName="CVDejaVu", fontSize=8.15, leading=12.5, leftIndent=13, firstLineIndent=-11, textColor=colors.HexColor("#243347"), spaceAfter=3),
    }
    doc = SimpleDocTemplate(str(name_for(locale, "pdf")), pagesize=A4, rightMargin=44, leftMargin=44,
                            topMargin=38, bottomMargin=38, title=f"{c['nameEn']} | {p['title']}",
                            author=c["nameEn"], subject="Professional software engineering resume")
    flow = []
    def add(key, text):
        flow.append(Paragraph(escape(text), style[key]))
    def add_head(text):
        add("head", text.upper())
    def add_bullet(text):
        flow.append(Paragraph("• " + escape(text), style["bullet"]))
    def add_link(label, link):
        return f'<link href="{escape(link, quote=True)}" color="#1F618C">{escape(label)}</link>'

    add("name", c["nameUk"] if locale == "uk" else c["nameEn"])
    add("title", p["title"] + " | " + p["subtitle"])
    flow.append(Paragraph(escape(c["location"])+"  ·  "+escape(c["phone"])+"  ·  "+
        add_link(c["email"], "mailto:"+c["email"]), style["small"]))
    flow.append(Paragraph("  |  ".join([
        add_link("GitHub", c["github"]), add_link("LinkedIn", c["linkedin"]),
        add_link("Galaxiora.com", c["website"])
    ]), style["small"]))
    add_head("PROFILE" if locale == "en" else "ПРОФІЛЬ")
    add("normal", p["profile"])
    add_head(p["labels"]["skills"])
    for line in p["skills"]:
        flow.append(Paragraph(f"<b>{escape(line['label'])}:</b> {escape(line['value'])}", style["normal"]))
    add_head(p["sectionWorks"])
    for project in p["projects"]:
        block = [Paragraph(escape(project["name"]+" | "+project["kind"]+" | "+project["period"]), style["job"]),
                 Paragraph(escape(project["intro"]), style["normal"])]
        for detail in project["details"]:
            block.append(Paragraph("• "+escape(detail), style["bullet"]))
        if project.get("live"):
            block.append(Paragraph(add_link("Live: Galaxiora.com", project["live"]), style["small"]))
        block.append(Paragraph(add_link("GitHub: "+project["name"], project["code"]), style["small"]))
        flow.extend(block)
    add_head(p["labels"]["experience"])
    for job in p["experience"]:
        add("job", job["title"]+" | "+job["period"])
        for detail in job["details"]:
            add_bullet(detail)
    add_head(p["labels"]["education"])
    add("normal", p["education"])
    add_head(p["labels"]["languages"])
    add("normal", p["languages"])
    doc.build(flow)


def hyperlink(document, paragraph, label, url):
    from docx.opc.constants import RELATIONSHIP_TYPE as RT
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    rid = document.part.relate_to(url, RT.HYPERLINK, is_external=True)
    link = OxmlElement("w:hyperlink")
    link.set(qn("r:id"), rid)
    run = OxmlElement("w:r")
    props = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "235E94")
    props.append(color)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    props.append(underline)
    run.append(props)
    text = OxmlElement("w:t")
    text.text = label
    run.append(text)
    link.append(run)
    paragraph._p.append(link)


def generate_docx(locale, profile):
    from docx import Document
    from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
    from docx.shared import Inches, Pt, RGBColor
    c, p = profile["contact"], profile[locale]
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.64)
    sec.bottom_margin = Inches(0.6)
    sec.left_margin = Inches(0.7)
    sec.right_margin = Inches(0.7)
    styles = doc.styles
    styles["Normal"].font.name = "Calibri"
    styles["Normal"].font.size = Pt(9)
    styles["Normal"].paragraph_format.space_after = Pt(4)
    for name, size in [("Heading 1", 11), ("Heading 2", 10)]:
        styles[name].font.name = "Calibri"
        styles[name].font.size = Pt(size)
        styles[name].font.color.rgb = RGBColor(35, 75, 115)
        styles[name].paragraph_format.space_before = Pt(11)
        styles[name].paragraph_format.space_after = Pt(4)
    headline = doc.add_paragraph()
    headline.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
    run = headline.add_run(c["nameUk"] if locale == "uk" else c["nameEn"])
    run.bold = True
    run.font.size = Pt(19)
    run.font.color.rgb = RGBColor(23, 48, 77)
    role = doc.add_paragraph()
    role.add_run(p["title"]+" | "+p["subtitle"]).bold = True
    contacts = doc.add_paragraph()
    contacts.add_run(c["location"]+" | "+c["phone"]+" | ")
    hyperlink(doc, contacts, c["email"], "mailto:"+c["email"])
    links = doc.add_paragraph()
    for i, (label, url) in enumerate([("GitHub",c["github"]),("LinkedIn",c["linkedin"]),("Galaxiora.com",c["website"])]):
        if i:
            links.add_run(" | ")
        hyperlink(doc, links, label, url)
    doc.add_heading("PROFILE" if locale == "en" else "ПРОФІЛЬ", level=1)
    doc.add_paragraph(p["profile"])
    doc.add_heading(p["labels"]["skills"].upper(), level=1)
    for line in p["skills"]:
        para = doc.add_paragraph()
        para.add_run(line["label"]+": ").bold = True
        para.add_run(line["value"])
    doc.add_heading(p["sectionWorks"].upper(), level=1)
    for project in p["projects"]:
        doc.add_heading(project["name"]+" | "+project["kind"]+" | "+project["period"], level=2)
        doc.add_paragraph(project["intro"])
        for detail in project["details"]:
            doc.add_paragraph(detail, style="List Bullet")
        link_para = doc.add_paragraph()
        if project.get("live"):
            hyperlink(doc, link_para, "Live website", project["live"])
            link_para.add_run(" | ")
        hyperlink(doc, link_para, "GitHub repository", project["code"])
    doc.add_heading(p["labels"]["experience"].upper(), level=1)
    for job in p["experience"]:
        doc.add_heading(job["title"]+" | "+job["period"], level=2)
        for detail in job["details"]:
            doc.add_paragraph(detail, style="List Bullet")
    doc.add_heading(p["labels"]["education"].upper(), level=1)
    doc.add_paragraph(p["education"])
    doc.add_heading(p["labels"]["languages"].upper(), level=1)
    doc.add_paragraph(p["languages"])
    doc.core_properties.author = c["nameEn"]
    doc.core_properties.title = c["nameEn"]+" — "+p["title"]
    doc.save(str(name_for(locale, "docx")))


def check(profile):
    from zipfile import ZipFile
    from pypdf import PdfReader
    for locale in ("en", "uk"):
        for ext in ("pdf", "docx"):
            path = name_for(locale, ext)
            if not path.is_file() or path.stat().st_size < 3000:
                raise RuntimeError(f"CV file missing or too small: {path}")
        reader = PdfReader(str(name_for(locale, "pdf")))
        if not 1 <= len(reader.pages) <= 4:
            raise RuntimeError(f"Unexpected PDF page count: {locale}")
        urls = [annotation.get_object().get("/A", {}).get("/URI", "")
                for page in reader.pages for annotation in page.get("/Annots", [])]
        if not any("github.com" in str(u) for u in urls):
            raise RuntimeError(f"PDF GitHub link absent: {locale}")
        with ZipFile(name_for(locale, "docx")) as z:
            bad = z.testzip()
            if bad or "word/document.xml" not in z.namelist():
                raise RuntimeError(f"Corrupt DOCX: {locale}")
            relationships = z.read("word/_rels/document.xml.rels").decode("utf8")
            if "github.com" not in relationships or "galaxiora.com" not in relationships:
                raise RuntimeError(f"DOCX links absent: {locale}")
    print("GP1_RESUMES_VERIFIED: 2 PDF + 2 DOCX, valid file structures and external links")


def main():
    profile = read_profile()
    if "--check" not in sys.argv:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for locale in ("en", "uk"):
            generate_pdf(locale, profile)
            generate_docx(locale, profile)
    check(profile)


if __name__ == "__main__":
    main()
