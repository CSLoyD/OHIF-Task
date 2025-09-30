import React, { useState, useRef, useEffect } from 'react';
import { Button, Icons } from '@ohif/ui-next';
import classNames from 'classnames';

interface VoiceNote {
  id: string;
  text: string;
  timestamp: Date;
  duration?: number;
  audioBlob?: Blob;
  tooth?: string;
  category: 'diagnosis' | 'treatment' | 'observation' | 'note';
}

interface DentalAnnotationPanelProps {
  onSave?: (annotations: VoiceNote[]) => void;
  initialAnnotations?: VoiceNote[];
  currentTooth?: string;
}

const DentalAnnotationPanel: React.FC<DentalAnnotationPanelProps> = ({
  onSave,
  initialAnnotations = [],
  currentTooth = 'FDI 11'
}) => {
  const [annotations, setAnnotations] = useState<VoiceNote[]>(initialAnnotations);
  const [isRecording, setIsRecording] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VoiceNote['category']>('observation');
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        addAnnotation(currentText, audioBlob, recordingTime);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const addAnnotation = (text: string, audioBlob?: Blob, duration?: number) => {
    if (!text.trim()) return;

    const newAnnotation: VoiceNote = {
      id: `annotation-${Date.now()}`,
      text: text.trim(),
      timestamp: new Date(),
      duration,
      audioBlob,
      tooth: currentTooth,
      category: selectedCategory
    };

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    setCurrentText('');
    
    if (onSave) {
      onSave(updatedAnnotations);
    }
  };

  const deleteAnnotation = (id: string) => {
    const updatedAnnotations = annotations.filter(ann => ann.id !== id);
    setAnnotations(updatedAnnotations);
    
    if (onSave) {
      onSave(updatedAnnotations);
    }
  };

  const playAudio = (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: VoiceNote['category']) => {
    switch (category) {
      case 'diagnosis': return 'stethoscope';
      case 'treatment': return 'wrench';
      case 'observation': return 'eye';
      case 'note': return 'pencil';
      default: return 'pencil';
    }
  };

  const getCategoryColor = (category: VoiceNote['category']) => {
    switch (category) {
      case 'diagnosis': return 'dental-status-error';
      case 'treatment': return 'dental-status-warning';
      case 'observation': return 'dental-status-success';
      case 'note': return 'dental-chip';
      default: return 'dental-chip';
    }
  };

  return (
    <div className="dental-annotation-panel dental-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-dental-accent">
          Dental Annotations
        </h3>
        <span className="text-sm text-dental-muted">
          Tooth: {currentTooth}
        </span>
      </div>

      {/* Recording Controls */}
      <div className="mb-4 p-3 bg-dental-surface border border-dental-border-soft rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as VoiceNote['category'])}
            className="dental-select text-sm"
          >
            <option value="observation">Observation</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="treatment">Treatment</option>
            <option value="note">General Note</option>
          </select>
          
          {isRecording && (
            <div className="flex items-center gap-2 text-dental-secondary">
              <div className="w-2 h-2 bg-dental-error rounded-full animate-pulse"></div>
              <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Type your annotation or record a voice note..."
          className="w-full p-2 bg-transparent border border-dental-border-soft rounded text-white placeholder-dental-muted resize-none"
          rows={3}
        />

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className={classNames(
              'dental-tooltip flex items-center gap-2',
              isRecording ? 'text-dental-error' : 'text-dental-secondary'
            )}
            data-tooltip={isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            <Icons.Microphone className="w-4 h-4" />
            {isRecording ? 'Stop' : 'Record'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => addAnnotation(currentText)}
            disabled={!currentText.trim()}
            className="dental-primary-button text-sm px-3 py-1"
          >
            Add Note
          </Button>
        </div>
      </div>

      {/* Annotations List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="dental-panel-empty">
            <Icons.FileText className="w-8 h-8 mx-auto mb-2 text-dental-muted" />
            <p className="text-sm">No annotations yet</p>
            <p className="text-xs text-dental-muted mt-1">
              Add voice notes or text annotations for this tooth
            </p>
          </div>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="dental-voice-note dental-slide-up"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={classNames(
                    'dental-status-indicator',
                    getCategoryColor(annotation.category)
                  )}>
                    <Icons.ByName name={getCategoryIcon(annotation.category)} />
                    {annotation.category}
                  </span>
                  <span className="text-xs text-dental-muted">
                    {annotation.tooth}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {annotation.audioBlob && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(annotation.audioBlob!)}
                      className="dental-tooltip p-1"
                      data-tooltip="Play audio"
                    >
                      <Icons.Play className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAnnotation(annotation.id)}
                    className="dental-tooltip p-1 text-dental-error hover:bg-red-500/10"
                    data-tooltip="Delete annotation"
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-white mb-2">{annotation.text}</p>
              
              <div className="flex items-center justify-between text-xs text-dental-muted">
                <span>{annotation.timestamp.toLocaleTimeString()}</span>
                {annotation.duration && (
                  <span className="flex items-center gap-1">
                    <Icons.Clock className="w-3 h-3" />
                    {formatTime(annotation.duration)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export Button */}
      {annotations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dental-border-soft">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const exportData = {
                tooth: currentTooth,
                timestamp: new Date().toISOString(),
                annotations: annotations.map(({ audioBlob, ...rest }) => rest)
              };
              
              const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
              });
              
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dental-annotations-${currentTooth.replace(' ', '-')}-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="dental-secondary-button w-full text-sm"
          >
            <Icons.Download className="w-4 h-4 mr-2" />
            Export Annotations
          </Button>
        </div>
      )}
    </div>
  );
};

export default DentalAnnotationPanel;
