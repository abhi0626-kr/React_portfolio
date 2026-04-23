import React, { useEffect, useMemo, useRef, useState } from 'react';

function SkillsOrbit({ skills }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [angleOffset, setAngleOffset] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const orbitRef = useRef(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 900);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAngleOffset((prev) => (prev + 0.35) % 360);
    }, 40);

    return () => window.clearInterval(interval);
  }, []);

  const centeredSkills = useMemo(() => skills, [skills]);
  const activeSkill = centeredSkills[activeIndex % centeredSkills.length] || centeredSkills[0];
  const maxInnerNodes = isCompact ? 6 : 8;
  const innerCount = Math.min(maxInnerNodes, centeredSkills.length);
  const outerCount = Math.max(0, centeredSkills.length - innerCount);
  const hasOuterRing = outerCount > 0;

  const positionedSkills = useMemo(() => {
    return centeredSkills.map((skill, index) => {
      const ring = index < innerCount ? 0 : 1;
      const indexInRing = ring === 0 ? index : index - innerCount;
      const totalInRing = ring === 0 ? innerCount : outerCount;

      return {
        skill,
        index,
        ring,
        indexInRing,
        totalInRing,
      };
    });
  }, [centeredSkills, innerCount, outerCount]);

  const calculatePosition = (node) => {
    const ringRotationSpeed = node.ring === 0 ? 1 : 0.72;
    const ringOffset = node.ring === 1 && node.totalInRing > 0 ? 180 / node.totalInRing : 0;
    const angle = ((node.indexInRing / node.totalInRing) * 360 + angleOffset * ringRotationSpeed + ringOffset) % 360;
    const radius = isCompact
      ? node.ring === 0
        ? 92
        : 138
      : node.ring === 0
      ? 150
      : 220;
    const radian = (angle * Math.PI) / 180;

    return {
      x: radius * Math.cos(radian),
      y: radius * Math.sin(radian),
      scale: node.index === activeIndex ? 1.15 : node.index === hoveredIndex ? 1.08 : 1,
      opacity: node.index === activeIndex ? 1 : node.ring === 0 ? 0.9 : 0.82,
      zIndex: node.index === activeIndex ? 24 : node.ring === 0 ? 14 : 10,
    };
  };

  return (
    <div className={`skills-orbit-shell ${hasOuterRing ? 'has-outer-ring' : ''}`} ref={orbitRef}>
      <div className="skills-orbit-center">
        <div className="skills-orbit-core">
          <span className="skills-orbit-label">Focused Skill</span>
          <h4>{activeSkill?.name}</h4>
          <p>{activeSkill?.note || 'Select a skill to explore its focus area.'}</p>
        </div>
      </div>

      <div className="skills-orbit-ring skills-orbit-ring-1" />
      {hasOuterRing && <div className="skills-orbit-ring skills-orbit-ring-2" />}

      {positionedSkills.map((node) => {
        const position = calculatePosition(node);
        const IconClass = node.skill.icon;
        const isActive = node.index === activeIndex;

        return (
          <button
            key={node.skill.name}
            type="button"
            className={`skills-orbit-node ${isActive ? 'active' : ''}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
              opacity: position.opacity,
              zIndex: position.zIndex,
            }}
            onMouseEnter={() => setHoveredIndex(node.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(node.index)}
            onBlur={() => setHoveredIndex(null)}
            onClick={() => setActiveIndex(node.index)}
            aria-label={node.skill.name}
          >
            <span className="skills-orbit-node-inner">
              <i className={IconClass} />
            </span>
            <span className="skills-orbit-tooltip">{node.skill.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SkillsOrbit;
