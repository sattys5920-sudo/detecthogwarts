import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { PROLOGUE } from '../data/story';

export default function ProloguePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const isLast = step === PROLOGUE.length - 1;

  return (
    <RequireGame>
      <div className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-xl flex-col items-center justify-center gap-6">
        <Card className="w-full">
          <p className="min-h-24 font-serif-kr text-lg leading-relaxed text-parchment-100">
            {PROLOGUE[step]}
          </p>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              {PROLOGUE.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-gold-400' : 'bg-white/15'}`}
                />
              ))}
            </div>
            <Button
              onClick={() => {
                if (isLast) navigate('/investigate');
                else setStep((s) => s + 1);
              }}
            >
              {isLast ? '조사 시작' : '다음'}
            </Button>
          </div>
        </Card>
      </div>
    </RequireGame>
  );
}
