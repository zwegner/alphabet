useState = React.useState;
useEffect = React.useEffect;
useRef = React.useRef;

var goodSound = new Audio('./good.mp3');
var badSound = new Audio('./bad.mp3');
var recordSound = new Audio('./record.mp3');

function range(min, max, step) {
  if (arguments.length === 1)
    [min, max, step] = [0, min, 1];
  if (arguments.length === 2)
    step = 1;
  let list = [];
  for (let x = min; x < max; x += step)
    list.push(x);
  return list;
}

warningGiven = false;
function lsLoad(key) {
  key = 'alpha-' + key;
  try {
    value = localStorage.getItem(key);
  } catch (e) {
    if (!warningGiven) {
      alert("Cannot access local storage. Records won't be saved.");
      warningGiven = true;
    }
    return null;
  }
  if (value === '' || value === null)
    return null;
  return JSON.parse(value);
}

function lsStore(key, value) {
  key = 'alpha-' + key;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Just ignore errors
  }
}

function Base() {
  let [state, setState] = useState({
    running: false, start: 0, end: 0, current: 0, next: 65, last: 0, times: {},
    isRecord: false, record: null, startLetter: 'a', endLetter: 'z'});
  let sref = useRef(state);
  sref.current = state;

  state.recordKey = 'best-time-' + state.startLetter + '-' + state.endLetter;
  state.record = lsLoad(state.recordKey);

  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      let state = sref.current;
      // Normal key
      if (e.key === state.startLetter && !state.running) {
        let time = new Date();
        setState({...state, start: time, last: time, running: true,
          next: e.keyCode + 1, times: {[e.keyCode]: 0}, isRecord: false});
      }
      else if (state.running && e.key >= 'a' && e.key <= 'z') {
        // Check if it's the key they should've hit
        if (e.keyCode === state.next) {
          let time = new Date();
          state.times[e.keyCode] = time - state.start;
          state.last = time;
          // Last letter: done!
          if (e.key === state.endLetter) {
            let total = time - state.start;
            state.isRecord = state.record === null || total < state.record;
            if (state.isRecord) {
              lsStore(state.recordKey, total);
              state.record = total;
              recordSound.play();
            }
            else
              goodSound.play();
            setState({...state, end: time, last: time, running: false});
          }
          else
            setState({...state, next: e.keyCode + 1});
        } else
          badSound.play();
      }
      // Enter/space: reset
      else if (state.running && (e.keyCode === 13 || e.keyCode === 32)) {
        setState({...state, end: new Date(), running: false, next: String.fromCharCode(97 + state.startLetter - 65)});
      }
      requestAnimationFrame(update);
    });
  }, []);

  function update() {
    let state = sref.current;
    if (state.running) {
      setState({...state, current: new Date() - state.start});
      requestAnimationFrame(update);
    } else
      setState({...state, current: state.end - state.start});
  }

  useEffect(() => {
    requestAnimationFrame(update);
  }, []);

  let dropdown = (name) => <select value={ state[name] }
      onChange={ (e) => {
        state[name] = e.target.value;
        setState({...state, next: String.fromCharCode(97 + state.startLetter - 65)});
        // Unfocus the dropdown so the first keypress isn't intercepted
        e.target.blur();
      } }>
    { range(26).map((a) => <option>{ String.fromCharCode(97 + a) }</option>) }
    </select>;

  const timeStr = (t) => (t === null || t === undefined) ? '---' :
    (t / 1000).toFixed(3) + 's';

  return <div className='container'>
    <h3>type the alphabet quick ya dingus</h3>
    <div className='letter'>{ String.fromCharCode(97 + state.next - 65) }</div>
    <div className='time'>{ timeStr(state.current) }</div>
    <div className='record'>
      Record: { timeStr(state.record) }
      { state.isRecord ?
        <div className='new-record'>New Record!</div>
        : null }
    </div>
    <div className='options'>
      Start: { dropdown('startLetter') }
      End: { dropdown('endLetter') }
    </div>
    <div className='breakdown'>
      breakdown:
      <table>
        { range(4).map((row) => <tr>
          { range(7).map((col) => {
            let idx = row * 7 + col;
            if (idx > 25)
              return null;
            let letter = String.fromCharCode(97 + idx);
            let time = timeStr(state.times[65 + idx])
            return <td>{`${letter}: ${time}`}</td>;
          }) }
        </tr>)}
      </table>
    </div>
  </div>;
}
