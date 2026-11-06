import fs from 'fs';

function trimSnowman(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Processing ${filePath}: originally ${data.notes.length} notes, measures 1 to ${Math.max(...data.notes.map(n => n.measure))}`);

  // Filter notes from measure 20 onwards
  const remainingNotes = data.notes.filter(n => n.measure >= 20);
  if (remainingNotes.length === 0) {
    throw new Error('No notes found in measure >= 20');
  }

  const t0 = Math.min(...remainingNotes.map(n => n.startTime));
  console.log(`Offset t0 = ${t0}s (Measure 20 start)`);

  const trimmedNotes = remainingNotes.map(n => {
    return {
      ...n,
      startTime: Math.max(0, Number((n.startTime - t0).toFixed(4))),
      measure: n.measure - 19, // Measure 20 becomes Measure 1
    };
  });

  // Calculate new duration
  const maxEnd = Math.max(...trimmedNotes.map(n => n.startTime + n.duration));
  const newDuration = Number((maxEnd + 1.5).toFixed(2));

  // Build clean sections
  const newSections = [
    {
      id: 'sia-snowman-main-theme',
      title: 'Verse & Main Theme (Takt 20)',
      startMeasure: 1,
      endMeasure: 16,
      startTime: 0,
      endTime: Number((trimmedNotes.find(n => n.measure > 16)?.startTime || 30).toFixed(2)),
      tempoSuggestion: '105 BPM',
      character: 'Contemporary / Pop Ballad',
    },
    {
      id: 'sia-snowman-chorus',
      title: 'Snowman Chorus & Climax',
      startMeasure: 17,
      endMeasure: Math.max(...trimmedNotes.map(n => n.measure)),
      startTime: Number((trimmedNotes.find(n => n.measure >= 17)?.startTime || 30).toFixed(2)),
      endTime: newDuration,
      tempoSuggestion: '105 BPM',
      character: 'Passionate & Warm',
    },
    {
      id: 'sia-snowman-full',
      title: 'Complete Song (Direct Takt 20 Edition)',
      startMeasure: 1,
      endMeasure: Math.max(...trimmedNotes.map(n => n.measure)),
      startTime: 0,
      endTime: newDuration,
      tempoSuggestion: '105 BPM',
      character: 'Full Master Arrangement',
    },
  ];

  data.notes = trimmedNotes;
  data.durationSeconds = newDuration;
  data.sections = newSections;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${filePath}: ${trimmedNotes.length} notes, duration ${newDuration}s, ${trimmedNotes[0].measure} to ${Math.max(...trimmedNotes.map(n => n.measure))} measures.`);
}

trimSnowman('public/scores/sia-snowman.json');
trimSnowman('src/data/scores/sia-snowman.json');
