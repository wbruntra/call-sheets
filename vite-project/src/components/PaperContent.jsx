import { EditModeContext } from './EditModeContext';
import SheetHeader from './SheetHeader';
import Section from './Section';

export default function PaperContent({ day, updateDay }) {
  const sections = day.sections || [];
  const pageBreaks = day.pageBreaks || [];

  return (
    <div className="paper" id="paper">
      <SheetHeader day={day} updateDay={updateDay} />
      {sections.map((sec, idx) => (
        <Section key={sec.id} sec={sec} idx={idx} updateDay={updateDay} pageBreaks={pageBreaks} />
      ))}
    </div>
  );
}