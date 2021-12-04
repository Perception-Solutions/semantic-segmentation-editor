import 'numeric'

let defaultDistanceThreshold = 0.06

export default class Sse3dPlaneEstimator {

    constructor(cloudData, startPoints) {
        this.allPoints = []
        cloudData.forEach((_, idx) => {
            const {x, y, z} = cloudData[idx]
            this.allPoints.push([x, y, z])
        })
        this.startPoints = startPoints;
        this.distanceThreshold = defaultDistanceThreshold

        if (this.startPoints.size < 3) {
            throw new Error(
                "Not enough points for plane estimation: only " + this.startPoints.size + " points were selected!"
            );
        }
    }

    estimate() {
        let basePoints = [];
        this.startPoints.forEach((idx) => {
            basePoints.push([...this.allPoints[idx]])
        })
        let planeNormal = this.estimatePlaneSVD(basePoints)

        let distances = this.getDistanceToAllPoints(planeNormal)

        let result = new Set()
        distances.forEach((distance, idx) => {
            if (distance <= this.distanceThreshold) {
                result.add(idx)
            }
        })

        // let difference = result.difference(this.startPoints)
        // throw new Error(
        //     "Here5 " + result.size + " and differences with start size: " + difference.size
        // );

        return result
    }

    estimatePlaneSVD(points) {
        let centroid = [0, 0, 0]

        points.forEach((point) => {
            centroid[0] += point[0]
            centroid[1] += point[1]
            centroid[2] += point[2]
        })


        centroid.forEach((_, idx) => {
            centroid[idx] /= points.length
        })

        points.forEach((point, idx) => {
            points[idx] = numeric.sub(point, centroid)
        })
        var normal = numeric.svd(points).V[2]
        normal = normal.concat(numeric.neg(numeric.dot(normal, centroid)))

        return numeric.div(normal, numeric.norm2(normal.slice(0, -1)))
    }

    getDistanceToAllPoints(planeNormal) {
        let pointsWithOnes = []
        this.allPoints.forEach((_, idx) => {
            let point = this.allPoints[idx]
            pointsWithOnes.push([point[0], point[1], point[2], 1])
        })
        let planeNormalT = numeric.transpose([planeNormal])
        let normalNorm = numeric.norm2(planeNormalT.slice(0, -1))
        let absDot = numeric.abs(numeric.dot(pointsWithOnes, planeNormalT))

        return absDot.map((item) => {
            return item / normalNorm
        })
    }
}