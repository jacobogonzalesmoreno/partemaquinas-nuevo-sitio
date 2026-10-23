from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

out = 'output/pdf/lista-inspeccion-tren-rodaje.pdf'
doc = SimpleDocTemplate(out, pagesize=letter, rightMargin=0.65*inch, leftMargin=0.65*inch, topMargin=0.55*inch, bottomMargin=0.55*inch)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitlePM', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#12365a'), alignment=TA_CENTER, spaceAfter=6))
styles.add(ParagraphStyle(name='SubPM', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13, textColor=colors.HexColor('#526579'), alignment=TA_CENTER, spaceAfter=14))
styles.add(ParagraphStyle(name='SectionPM', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11.2, leading=14, textColor=colors.HexColor('#12365a'), spaceBefore=5, spaceAfter=3))
styles.add(ParagraphStyle(name='BodyPM', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.2, leading=12.5, textColor=colors.HexColor('#25364a'), spaceAfter=2))
styles.add(ParagraphStyle(name='SmallPM', parent=styles['BodyText'], fontName='Helvetica', fontSize=8, leading=10.5, textColor=colors.HexColor('#526579')))

story = [Paragraph('LISTA DE INSPECCIÓN DEL TREN DE RODAJE', styles['TitlePM']), Paragraph('Guía breve para excavadoras · Use junto con el manual de operación y mantenimiento de su modelo.', styles['SubPM'])]
sections = [
 ('Antes de empezar', ['Estacione en un terreno firme y siga el procedimiento de seguridad de su equipo.', 'Retire barro, piedras y residuos visibles antes de revisar los componentes.']),
 ('Revise visualmente', ['Zapatas, eslabones y pernos: observe grietas, deformaciones, piezas flojas o faltantes.', 'Rodillos y ruedas guía: busque daños, desgaste irregular o fugas.', 'Rueda dentada y cadena: observe desgaste y contacto irregular.', 'Bastidor y protecciones: compruebe que estén firmes y sin obstrucciones.']),
 ('Registre y dé seguimiento', ['Anote fecha, horas de operación, tipo de terreno y cualquier hallazgo.', 'Compare con inspecciones anteriores. Si encuentra daños o una condición inusual, consulte a un técnico calificado antes de operar.']),
]
for heading, items in sections:
    story.append(Paragraph(heading, styles['SectionPM']))
    rows = [[Paragraph('[ ]', styles['BodyPM']), Paragraph(item, styles['BodyPM'])] for item in items]
    table = Table(rows, colWidths=[0.25*inch, 6.65*inch], hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),2),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2)]))
    story.append(table)
    story.append(Spacer(1,4))

note = '<b>Importante:</b> La tensión, los límites de desgaste y los intervalos dependen de la marca y el modelo. No use medidas genéricas; consulte el manual de su máquina.'
story.append(Spacer(1,8))
story.append(Paragraph(note, ParagraphStyle('NotePM', parent=styles['BodyPM'], backColor=colors.HexColor('#fff7e8'), borderColor=colors.HexColor('#e9a500'), borderWidth=0.7, borderPadding=8, leading=12.5, spaceAfter=7)))
story.append(Paragraph('Notas / hallazgos:', styles['SectionPM']))
story.append(Paragraph('_________________________________________________________________________________________<br/><br/>_________________________________________________________________________________________<br/><br/>_________________________________________________________________________________________', styles['SmallPM']))
story.append(Spacer(1,8))
story.append(Paragraph('Referencia complementaria: <link href="https://www.cat.com/en_US/articles/for-owners/what-to-know-about-excavator-undercarriage-maintenance.html" color="#a66d00">Caterpillar: mantenimiento del tren de rodaje</link> · <link href="https://www.komatsu.com/en-ae/products/spare-parts/genuine-parts/undercarriage/maintenance-tips" color="#a66d00">Komatsu: consejos de mantenimiento</link>', styles['SmallPM']))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#d8e0e8'))
    canvas.line(0.65*inch, 0.42*inch, letter[0]-0.65*inch, 0.42*inch)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(colors.HexColor('#718096'))
    canvas.drawString(0.65*inch, 0.27*inch, 'ParteMáquinas · Material de referencia')
    canvas.drawRightString(letter[0]-0.65*inch, 0.27*inch, f'Página {doc.page}')
    canvas.restoreState()

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(out)

