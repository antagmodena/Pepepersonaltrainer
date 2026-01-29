export const EXERCISE_CATEGORIES = {
  tecnica: { label: '🎾 Tecnica', color: '#3B82F6', bgColor: '#EFF6FF' },
  tattica: { label: '🧠 Tattica', color: '#8B5CF6', bgColor: '#F5F3FF' },
  fisico: { label: '💪 Fisico', color: '#F97316', bgColor: '#FFF7ED' },
  mentale: { label: '🧘 Mentale', color: '#14B8A6', bgColor: '#F0FDFA' }
};

export const EXERCISE_LIBRARY = {
  tecnica: [
    { id: 'bandeja_base', name: 'Bandeja da fermo', duration: '10 min', description: 'Focus su punto di impatto e direzione' },
    { id: 'bandeja_movimento', name: 'Bandeja in movimento', duration: '15 min', description: 'Con spostamento laterale e arretramento' },
    { id: 'bandeja_pressione', name: 'Bandeja sotto pressione', duration: '10 min', description: 'Palloni alti e veloci, simulazione partita' },
    { id: 'vibora_base', name: 'Vibora base', duration: '10 min', description: 'Effetto e direzione della vibora' },
    { id: 'vibora_angolata', name: 'Vibora angolata', duration: '15 min', description: 'Angoli stretti verso il vetro' },
    { id: 'smash_potenza', name: 'Smash potenza', duration: '10 min', description: 'Smash per chiusura del punto' },
    { id: 'smash_x3', name: 'Smash x3', duration: '15 min', description: 'Verso vetro laterale per uscita x3' },
    { id: 'smash_x4', name: 'Smash x4', duration: '15 min', description: 'Verso angolo per uscita x4' },
    { id: 'volee_diritta', name: 'Volée di diritta', duration: '10 min', description: 'A rete, focus su compattezza' },
    { id: 'volee_rovescio', name: 'Volée di rovescio', duration: '10 min', description: 'Polso fermo' },
    { id: 'uscita_parete_lat', name: 'Uscita parete laterale', duration: '15 min', description: 'Lettura e uscita' },
    { id: 'uscita_parete_fondo', name: 'Uscita parete di fondo', duration: '15 min', description: 'Lettura e uscita' },
    { id: 'pallonetto_difensivo', name: 'Pallonetto difensivo', duration: '10 min', description: 'Alto per guadagnare tempo' },
    { id: 'pallonetto_offensivo', name: 'Pallonetto offensivo', duration: '10 min', description: 'Teso per sorprendere' },
    { id: 'chiquita', name: 'Chiquita', duration: '10 min', description: 'Colpo basso ai piedi avversari' },
    { id: 'servizio_piatto', name: 'Servizio piatto', duration: '10 min', description: 'Traiettoria piatta' },
    { id: 'servizio_slice', name: 'Servizio slice', duration: '10 min', description: 'Con effetto slice' },
    { id: 'bajada', name: 'Bajada', duration: '10 min', description: 'Discesa dalla rete con colpo potente' },
  ],
  tattica: [
    { id: 'gioco_parallelo', name: 'Gioco parallelo', duration: '15 min', description: 'Costruzione punto con palle parallele' },
    { id: 'cambio_direzione', name: 'Cambio di direzione', duration: '15 min', description: 'Quando e come cambiare direzione' },
    { id: 'subida_red', name: 'Subida a rete', duration: '15 min', description: 'Transizione difesa-attacco' },
    { id: 'difesa_4_pareti', name: 'Difesa a 4 pareti', duration: '20 min', description: 'Resistere usando tutte le pareti' },
    { id: 'schema_servizio', name: 'Schema su servizio', duration: '15 min', description: 'Combinazioni servizio + terzo colpo' },
    { id: 'schema_resto', name: 'Schema su resto', duration: '15 min', description: 'Combinazioni resto + quarto colpo' },
    { id: 'gestione_lob', name: 'Gestione del lob', duration: '15 min', description: 'Quando e come usare il pallonetto' },
    { id: 'gioco_coppia', name: 'Gioco di coppia', duration: '20 min', description: 'Movimenti sincronizzati col compagno' },
    { id: 'pressione_avversari', name: 'Mettere pressione', duration: '15 min', description: 'Come pressare a rete' },
  ],
  fisico: [
    { id: 'footwork_base', name: 'Footwork base', duration: '10 min', description: 'Spostamenti laterali e frontali' },
    { id: 'footwork_reattivo', name: 'Footwork reattivo', duration: '10 min', description: 'Reazione a stimoli visivi' },
    { id: 'split_step', name: 'Split step', duration: '10 min', description: 'Timing dello split step' },
    { id: 'riscaldamento', name: 'Riscaldamento completo', duration: '15 min', description: 'Routine pre-partita' },
    { id: 'resistenza_scambi', name: 'Resistenza scambi lunghi', duration: '20 min', description: 'Simulazione scambi prolungati' },
    { id: 'esplosivita', name: 'Esplosività', duration: '10 min', description: 'Scatti brevi e cambi di ritmo' },
    { id: 'coordinazione', name: 'Coordinazione', duration: '10 min', description: 'Occhio-mano-piedi' },
  ],
  mentale: [
    { id: 'gestione_pressione', name: 'Gestione pressione', duration: '15 min', description: 'Tecniche per momenti di pressione' },
    { id: 'routine_pre_punto', name: 'Routine pre-punto', duration: '10 min', description: 'Routine costante prima di ogni punto' },
    { id: 'comunicazione_coppia', name: 'Comunicazione coppia', duration: '15 min', description: 'Comunicare efficacemente col compagno' },
    { id: 'gestione_errore', name: 'Gestione errore', duration: '10 min', description: 'Reset mentale dopo un errore' },
    { id: 'visualizzazione', name: 'Visualizzazione', duration: '10 min', description: 'Visualizzare i colpi prima di eseguirli' },
    { id: 'concentrazione', name: 'Focus e concentrazione', duration: '15 min', description: 'Mantenere concentrazione tutta la partita' },
    { id: 'gestione_vantaggio', name: 'Gestire il vantaggio', duration: '10 min', description: 'Non calare quando si è in vantaggio' },
  ]
};

export type ExerciseCategory = keyof typeof EXERCISE_LIBRARY;
