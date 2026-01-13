import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { GridWorld } from '@/components/GridWorld';
import { ControlPanel } from '@/components/ControlPanel';
import { InfoPanel } from '@/components/InfoPanel';
import { GridEditor } from '@/components/GridEditor';
import {
  MDPState,
  CellType,
  createInitialState,
  valueIterationStep,
  policyIterationStep,
} from '@/lib/mdp';

const Index = () => {
  const [state, setState] = useState<MDPState>(createInitialState());
  const [algorithm, setAlgorithm] = useState<'value' | 'policy'>('value');
  const [showValues, setShowValues] = useState(true);
  const [showPolicy, setShowPolicy] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTool, setSelectedTool] = useState<CellType | null>(null);

  const handleStep = useCallback(() => {
    setState((prev) => {
      const stepFn = algorithm === 'value' ? valueIterationStep : policyIterationStep;
      return stepFn(prev);
    });
  }, [algorithm]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setState((prev) => ({
      ...createInitialState(),
      gamma: prev.gamma,
      grid: prev.grid.map(row => 
        row.map(cell => ({
          ...cell,
          value: 0,
          policy: null,
        }))
      ),
    }));
  }, []);

  const handleGammaChange = useCallback((gamma: number) => {
    setState((prev) => ({ ...prev, gamma }));
    handleReset();
  }, [handleReset]);

  const handleAlgorithmChange = useCallback((newAlgorithm: 'value' | 'policy') => {
    setAlgorithm(newAlgorithm);
    handleReset();
  }, [handleReset]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!selectedTool) return;
    
    setState((prev) => {
      const newGrid = prev.grid.map((r, ri) =>
        r.map((cell, ci) => {
          if (ri === row && ci === col) {
            return { ...cell, type: selectedTool, value: 0, policy: null };
          }
          return cell;
        })
      );
      return { ...prev, grid: newGrid, iteration: 0, converged: false, delta: 0 };
    });
  }, [selectedTool]);

  const handleRun = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Auto-run effect
  useEffect(() => {
    if (!isRunning || state.converged) {
      if (state.converged) setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      handleStep();
    }, 200);

    return () => clearTimeout(timer);
  }, [isRunning, state.converged, handleStep]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          {/* Main Grid Area */}
          <div className="space-y-6">
            <GridEditor 
              selectedTool={selectedTool}
              onToolSelect={setSelectedTool}
            />
            <GridWorld
              grid={state.grid}
              showValues={showValues}
              showPolicy={showPolicy}
              onCellClick={handleCellClick}
            />
            <InfoPanel />
          </div>

          {/* Control Panel Sidebar */}
          <div className="lg:sticky lg:top-6 h-fit">
            <ControlPanel
              algorithm={algorithm}
              onAlgorithmChange={handleAlgorithmChange}
              gamma={state.gamma}
              onGammaChange={handleGammaChange}
              showValues={showValues}
              onShowValuesChange={setShowValues}
              showPolicy={showPolicy}
              onShowPolicyChange={setShowPolicy}
              onStep={handleStep}
              onRun={handleRun}
              onReset={handleReset}
              isRunning={isRunning}
              iteration={state.iteration}
              converged={state.converged}
              delta={state.delta}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-4 text-center text-sm text-muted-foreground">
        <p>MDP Grid World Visualizer • AI Assignment #2</p>
      </footer>
    </div>
  );
};

export default Index;
