import { CpuUsage } from './cpu'

const cpuUsage = new CpuUsage()

export const getCpuUsage = () => cpuUsage.usage
