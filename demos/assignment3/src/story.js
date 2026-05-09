export const stages = [
  {
    id: "title",
    copy: `
      <h2>Can you find a planet just by watching a star blink?</h2>
      <p>Astronomers don’t see most planets directly. They look for tiny dips in starlight and hope it’s not just noise.</p>
      <p class="small-text">Yes, I pinky promise there's a planet here!</p>
    `,
    props: {
      noiseLevel: 0.4,
      planetSize: 0.1,
      orbitalPeriod: 75,
      showSliders: { size: false, period: false, noise: false },
      showToggle: false,
      seed: 42,
    }
  },

  {
    id: "what-is-this",
    copy: `
      <p>This is brightness over time. Imagine staring at a star and recording how bright it is every second.</p>
      <p>Ideally, it should be flat. At this scale, the star looks constant.</p>
    `,
    props: {
      noiseLevel: 0,
      planetSize: 0,
      orbitalPeriod: 50,
      showSliders: { size: false, period: false, noise: false },
      showToggle: false,
      seed: 123,
      yAxisRange: [0.7, 1.3],
    }
  },

  {
    id: "how-planets-show-up",
    copy: `
      <p>Now imagine a planet passing in front of the star. It blocks a tiny bit of light.</p>
      <p>That’s the dip.</p>
      <p class="small-text">Try making the planet bigger or faster. Right now it's pretty easy to see what's happening.</p>
    `,
    props: {
      noiseLevel: 0,
      planetSize: 0.1,
      orbitalPeriod: 50,
      showSliders: { size: true, period: true, noise: false },
      showToggle: false,
      seed: 456,
      yAxisRange: [0.4, 1.1],
    }
  },

  {
    id: "ruin-it-with-noise",
    copy: `
      <p>In real life, data is messy. Telescopes aren’t perfect. Stars aren’t perfectly stable either.</p>
      <p>So the signal gets buried.</p>
      <p>Somewhere in here is a planet. Good luck.</p>
      <p class="small-text">If you're stuck, you can cheat and reveal the clean signal.</p>
    `,
    props: {
      noiseLevel: 0.2,
      planetSize: 0.1,
      orbitalPeriod: 50,
      showSliders: { size: false, period: false, noise: false },
      showToggle: true,
    }
  },

  {
    id: "your-turn",
    copy: `
      <p>Okay, your turn.</p>
      <p>Is there a planet here? Or is your brain just seeing patterns because it really wants there to be one?</p>
      <p class="small-text">Pay attention to which kinds of planets are easier to spot.</p>
    `,
    props: {
      noiseLevel: 0.2,
      planetSize: 0.1,
      orbitalPeriod: 50,
      showSliders: { size: true, period: true, noise: true },
      showToggle: true,
      seed: 789,
      yAxisRange: [0.2, 1.6],
    }
  },

  {
    id: "detection-patterns",
    copy: `
      <p>Some planets are just easier to find.</p>
      <p>Big planets block more light. Planets that orbit faster give you more chances to notice a pattern.</p>
      <p>Small, slow planets? Um yeah… those are tough.</p>
      <p>This is why a lot of the first planets we found were the loud ones. They were big and fast enough to stand out without much effort.</p>
    `,
    props: {}
  },

  {
    id: "how-astronomers-do-it",
    copy: `
      <p>Astronomers don’t just look once. They watch the same stars over and over again.</p>
      <p>One noisy observation might not tell you much. But when the same tiny dip keeps showing up at regular intervals, a pattern starts to emerge.</p>
      <p>Your brain is not great at staring at noisy graphs for weeks. Computers are a little more patient.</p>
      <p>Noticing tiny patterns that kept repeating is how missions like the Kepler Telescope found thousands of planets.</p>
    `,
    props: {
      noiseLevel: 0.3,
      planetSize: 0.08,
      orbitalPeriod: 30,
      showSliders: { size: true, period: true, noise: true },
      showToggle: true,
    }
  },

  {
    id: "wrap-up",
    copy: `
      <p>So yeah, sometimes finding a planet is just noticing that a star blinked in a weirdly consistent way.</p>
    `,
    props: {
      noiseLevel: 0.1,
      planetSize: 0.08,
      orbitalPeriod: 30,
      showSliders: { size: false, period: false, noise: false },
      showToggle: true,
    }
  }
];
