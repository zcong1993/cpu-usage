import * as os from 'os'

const getCpus = () => os.cpus()

const getAllBusy = (t: os.CpuInfo): [number, number] => {
  const idle: number = t.times.idle
  const busy: number = t.times.irq + t.times.nice + t.times.sys + t.times.user

  return [busy + idle, busy]
}

const calculateBusy = (t1: os.CpuInfo, t2: os.CpuInfo): number => {
  const [t1All, t1Busy] = getAllBusy(t1)
  const [t2All, t2Busy] = getAllBusy(t2)

  if (t2Busy <= t1Busy) {
    /* istanbul ignore next */
    return 0
  }

  if (t2All <= t1All) {
    /* istanbul ignore next */
    return 100
  }

  return Math.min(100, Math.max(0, ((t2Busy - t1Busy) / (t2All - t1All)) * 100))
}

const calculateAllBusy = (t1: os.CpuInfo[], t2: os.CpuInfo[]): number[] => {
  if (t1.length !== t2.length) {
    /* istanbul ignore next */
    throw new Error(`received two CPU counts: ${t1.length} != ${t2.length}`)
  }

  const res: number[] = []

  for (let i = 0; i < t1.length; i += 1) {
    res[i] = calculateBusy(t1[i], t2[i])
  }

  return res
}

const mergeAll = (t: os.CpuInfo[]): [os.CpuInfo] => {
  const res: os.CpuInfo = {
    model: '',
    speed: 0,
    times: {
      idle: 0,
      user: 0,
      sys: 0,
      irq: 0,
      nice: 0,
    },
  }

  for (const tt of t) {
    res.times.idle += tt.times.idle
    res.times.user += tt.times.user
    res.times.sys += tt.times.sys
    res.times.irq += tt.times.irq
    res.times.nice += tt.times.nice
  }

  return [res]
}

export class CpuUsage {
  private isFirstTime: boolean = true
  private lastCpuInfo: os.CpuInfo[]
  private cpuPercent: number = 0

  constructor(
    private readonly sampleInterval: number = 500,
    private readonly beta: number = 0.95
  ) {
    setInterval(() => this.ticker(), this.sampleInterval).unref()
  }

  ticker() {
    if (this.isFirstTime) {
      this.lastCpuInfo = getCpus()
      this.isFirstTime = false
      return
    }

    const nowInfo = getCpus()
    const res = calculateAllBusy(mergeAll(this.lastCpuInfo), mergeAll(nowInfo))
    const newPercent = res[0]
    // cpu = cpuᵗ⁻¹ * beta + cpuᵗ * (1 - beta)
    this.cpuPercent =
      this.cpuPercent === 0
        ? newPercent
        : this.cpuPercent * this.beta + newPercent * (1 - this.beta)
    this.lastCpuInfo = nowInfo
  }

  get usage() {
    return this.cpuPercent
  }
}
