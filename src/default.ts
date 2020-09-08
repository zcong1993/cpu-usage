import { CpuUsage } from './cpu'

const cpuUsage = new CpuUsage()

export const getCpuUsage = () => cpuUsage.usage

setInterval(() => {
  console.log(getCpuUsage())
}, 1000)
