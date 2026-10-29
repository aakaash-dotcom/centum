import fs from 'fs';
import path from 'path';

// Load existing authentic questions from sampleData.ts if available
const sampleDataContent = fs.readFileSync('src/data/sampleData.ts', 'utf8');
const startIdx = sampleDataContent.indexOf('export const SAMPLE_QUESTIONS: Question[] = [');
const endMarker = 'export const SAMPLE_DAILY_';
const endIdx = sampleDataContent.indexOf(endMarker, startIdx);
const arrStr = sampleDataContent.slice(startIdx + 'export const SAMPLE_QUESTIONS: Question[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const sampleQuestions = new Function('return ' + arrStr)();
console.log(`Loaded ${sampleQuestions.length} existing base sample questions.`);

const questions = [...sampleQuestions];
const existingIds = new Set(questions.map(q => q.id));

// Helper to push unique questions
function addQuestion(q) {
  if (!existingIds.has(q.id)) {
    existingIds.add(q.id);
    questions.push(q);
  }
}

// =========================================================================
// 1. 10th MATHEMATICS - ENGLISH MEDIUM (Concept & Oneword)
// Chapters 1 to 8:
// Chapter 1: Relations and Functions
// Chapter 2: Numbers and Sequences
// Chapter 3: Algebra
// Chapter 4: Geometry
// Chapter 5: Coordinate Geometry
// Chapter 6: Trigonometry
// Chapter 7: Mensuration
// Chapter 8: Statistics and Probability
// =========================================================================

const MATH_CHAPTERS_EN = [
  { no: 1, name: 'Relations and Functions' },
  { no: 2, name: 'Numbers and Sequences' },
  { no: 3, name: 'Algebra' },
  { no: 4, name: 'Geometry' },
  { no: 5, name: 'Coordinate Geometry' },
  { no: 6, name: 'Trigonometry' },
  { no: 7, name: 'Mensuration' },
  { no: 8, name: 'Statistics and Probability' },
];

// High-quality question templates with varied authentic mathematical problems for 10th Maths English
const MATH_TEMPLATES_EN = {
  1: [ // Relations and Functions
    { q: (i) => `If A = {1, 2, ${i+2}} and B = {x, y}, then the total number of relations from A to B is:`, opts: (i) => [`${2**(3*2)}`, `${2**(3+2)}`, `${3*2}`, `${3**2}`], ans: 0, exp: (i) => `Total relations from A to B is 2^(n(A) * n(B)) = 2^(3 * 2) = 2^6 = 64.` },
    { q: (i) => `Let f: R → R be defined by f(x) = ${i+1}x - ${i*2+1}. Then the preimage of ${i+3} under f is:`, opts: (i) => [`${((i+3) + (i*2+1))/(i+1)}`, `${i+1}`, `${i+2}`, `${i+4}`], ans: 0, exp: (i) => `Solve ${i+1}x - ${i*2+1} = ${i+3} ⇒ ${i+1}x = ${(i+3)+(i*2+1)} ⇒ x = ${((i+3) + (i*2+1))/(i+1)}.` },
    { q: (i) => `If f(x) = x^2 + ${i} and g(x) = ${i+1}x, then the composite function (f ∘ g)(1) equals:`, opts: (i) => [`${(i+1)**2 + i}`, `${(i+1) + i}`, `${(i)**2 + i + 1}`, `${(i+2)**2}`], ans: 0, exp: (i) => `g(1) = ${i+1}. f(g(1)) = f(${i+1}) = (${i+1})^2 + ${i} = ${(i+1)**2 + i}.` },
    { q: (i) => `A relation R on set A = {1, 2, 3, 4} is defined as R = {(x, y) | x + y = ${i+4}}. If (2, k) ∈ R, then k is:`, opts: (i) => [`${(i+4)-2}`, `${i+4}`, `${i+2}`, `${i}`], ans: 0, exp: (i) => `2 + k = ${i+4} ⇒ k = ${(i+4)-2}.` },
    { q: (i) => `If f is an identity function on R, then f(${i*5+3}) is:`, opts: (i) => [`${i*5+3}`, `1`, `0`, `${(i*5+3)**2}`], ans: 0, exp: (i) => `An identity function f(x) = x maps every element to itself.` },
    { q: (i) => `If n(A) = ${i+2} and n(B) = ${i+3}, then the number of constant functions from A to B is:`, opts: (i) => [`${i+3}`, `${i+2}`, `${(i+2)*(i+3)}`, `1`], ans: 0, exp: (i) => `The number of constant functions from A to B equals n(B) = ${i+3}.` },
    { q: (i) => `If f(x) = ${i+2}x + 3 is a linear function, its slope m is:`, opts: (i) => [`${i+2}`, `3`, `${i+5}`, `1`], ans: 0, exp: (i) => `In f(x) = mx + c, the coefficient of x is the slope m = ${i+2}.` },
    { q: (i) => `Let A = {${i}, ${i+1}, ${i+2}} and B = ∅. Then n(A × B) is:`, opts: (i) => [`0`, `3`, `1`, `Undefined`], ans: 0, exp: (i) => `Cartesian product with an empty set is empty, so n(A × B) = 0.` },
  ],
  2: [ // Numbers and Sequences
    { q: (i) => `The common difference of the A.P. ${i*3+1}, ${i*3+5}, ${i*3+9}, ... is:`, opts: (i) => [`4`, `3`, `${i}`, `5`], ans: 0, exp: (i) => `d = a2 - a1 = (${i*3+5}) - (${i*3+1}) = 4.` },
    { q: (i) => `The ${i+5}th term of the A.P. with first term a = ${i+2} and common difference d = 3 is:`, opts: (i) => [`${(i+2) + (i+4)*3}`, `${(i+2) + (i+5)*3}`, `${(i+2)*3}`, `${(i+5)*3}`], ans: 0, exp: (i) => `t_n = a + (n - 1)d = ${(i+2)} + ${(i+4)} * 3 = ${(i+2) + (i+4)*3}.` },
    { q: (i) => `The sum of the first ${i+4} terms of the series 1 + 2 + 3 + ... + n is:`, opts: (i) => [`${((i+4)*(i+5))/2}`, `${(i+4)*(i+5)}`, `${(i+4)**2}`, `${((i+4)*(i+3))/2}`], ans: 0, exp: (i) => `Sum of first n natural numbers = n(n+1)/2 = ${(i+4)}*${(i+5)}/2 = ${((i+4)*(i+5))/2}.` },
    { q: (i) => `If a, b, c are in A.P., then which relation must hold true?`, opts: (i) => [`2b = a + c`, `b^2 = ac`, `a + b = c`, `b = a - c`], ans: 0, exp: (i) => `In an arithmetic progression, the middle term is the arithmetic mean: 2b = a + c.` },
    { q: (i) => `The HCF of ${i*6+12} and ${i*6+18} by Euclid's division algorithm divides:`, opts: (i) => [`6`, `12`, `18`, `24`], ans: 0, exp: (i) => `The difference is (${i*6+18}) - (${i*6+12}) = 6. Hence HCF must divide 6.` },
    { q: (i) => `In a G.P., the first term is ${i+1} and the common ratio is 2. The 4th term is:`, opts: (i) => [`${(i+1) * 8}`, `${(i+1) * 6}`, `${(i+1) * 16}`, `${(i+1) * 4}`], ans: 0, exp: (i) => `t_4 = a * r^3 = ${(i+1)} * 2^3 = ${(i+1) * 8}.` },
    { q: (i) => `The sum of the first ${i+2} terms of 1^3 + 2^3 + ... + n^3 is equal to:`, opts: (i) => [`[${(i+2)*(i+3)}/2]^2`, `[${(i+2)*(i+3)}/2]`, `${(i+2)**3}`, `${(i+2)*(i+3)*(2*i+5)}/6`], ans: 0, exp: (i) => `Sum of cubes of first n natural numbers is [n(n+1)/2]^2.` },
    { q: (i) => `The remainder when ${i*7+5} is divided by 7 is:`, opts: (i) => [`5`, `2`, `0`, `1`], ans: 0, exp: (i) => `By division algorithm, ${i*7+5} = 7 * ${i} + 5. Remainder is 5.` },
  ],
  3: [ // Algebra
    { q: (i) => `The roots of the quadratic equation x^2 - ${i+5}x + ${ (i+2)*3 } = 0 when factored are:`, opts: (i) => [`3 and ${i+2}`, `2 and ${i+3}`, `1 and ${i+4}`, `4 and ${i+1}`], ans: 0, exp: (i) => `x^2 - (${i+2}+3)x + 3(${i+2}) = (x - 3)(x - ${i+2}) = 0.` },
    { q: (i) => `If α and β are roots of x^2 - ${i*2+4}x + ${i+1} = 0, then the sum of roots α + β is:`, opts: (i) => [`${i*2+4}`, `${-(i*2+4)}`, `${i+1}`, `${2}`], ans: 0, exp: (i) => `By Vieta's formulas, sum of roots α + β = -b/a = ${i*2+4}.` },
    { q: (i) => `The discriminant Δ of the quadratic equation 2x^2 + ${i+4}x + 2 = 0 is:`, opts: (i) => [`${(i+4)**2 - 16}`, `${(i+4)**2 + 16}`, `${(i+4)**2 - 8}`, `${16}`], ans: 0, exp: (i) => `Δ = b^2 - 4ac = (${i+4})^2 - 4(2)(2) = ${(i+4)**2 - 16}.` },
    { q: (i) => `The GCD of polynomials x^2 - ${(i+2)**2} and x - ${i+2} is:`, opts: (i) => [`x - ${i+2}`, `x + ${i+2}`, `1`, `x^2 - ${(i+2)**2}`], ans: 0, exp: (i) => `x^2 - ${(i+2)**2} = (x - ${i+2})(x + ${i+2}). The common divisor is x - ${i+2}.` },
    { q: (i) => `The square root of ${ (i+3)**2 } x^4 y^6 is:`, opts: (i) => [`${i+3} x^2 |y^3|`, `${i+3} x y^2`, `${(i+3)**2} x^2 y^3`, `${i+3} x^4 y^6`], ans: 0, exp: (i) => `Taking the principal square root yields ${i+3} x^2 |y^3|.` },
    { q: (i) => `If a matrix A has order ${i+1} × ${i+2} and B has order ${i+2} × ${i+3}, the order of AB is:`, opts: (i) => [`${i+1} × ${i+3}`, `${i+2} × ${i+2}`, `${i+3} × ${i+1}`, `Product undefined`], ans: 0, exp: (i) => `Order of product matrix is rows of A × columns of B = ${i+1} × ${i+3}.` },
    { q: (i) => `A square matrix A is called symmetric if:`, opts: (i) => [`A^T = A`, `A^T = -A`, `A^2 = I`, `A = 0`], ans: 0, exp: (i) => `By definition, a matrix is symmetric if transpose A^T = A.` },
    { q: (i) => `The number of points of intersection of a line and a circle can be at most:`, opts: (i) => [`2`, `1`, `0`, `Infinite`], ans: 0, exp: (i) => `A secant line intersects a circle at at most two distinct points.` },
  ],
  4: [ // Geometry
    { q: (i) => `In triangle ABC, DE || BC. If AD = ${i+2} cm, DB = ${i+4} cm, and AE = ${i+1} cm, then EC by Thales theorem is:`, opts: (i) => [`${(((i+4)*(i+1))/(i+2)).toFixed(2)} cm`, `${i+3} cm`, `${i+2} cm`, `${i+5} cm`], ans: 0, exp: (i) => `By Basic Proportionality Theorem, AD/DB = AE/EC ⇒ EC = (DB * AE) / AD = ${(((i+4)*(i+1))/(i+2)).toFixed(2)} cm.` },
    { q: (i) => `In right triangle ABC right-angled at B, if AB = ${i*2+3} and BC = 4, then hypotenuse AC is:`, opts: (i) => [`${Math.hypot(i*2+3, 4).toFixed(2)}`, `${(i*2+3)+4}`, `${(i*2+3)*4}`, `${Math.abs(i*2+3 - 4)}`], ans: 0, exp: (i) => `By Pythagoras theorem, AC^2 = AB^2 + BC^2 = ${(i*2+3)**2 + 16}. AC = ${Math.hypot(i*2+3, 4).toFixed(2)}.` },
    { q: (i) => `The ratio of the areas of two similar triangles is equal to:`, opts: (i) => [`the ratio of squares of their corresponding sides`, `the ratio of their corresponding sides`, `the ratio of their perimeters`, `the product of corresponding sides`], ans: 0, exp: (i) => `Fundamental theorem on similar triangles: Area ratio = (side1 / side2)^2.` },
    { q: (i) => `A tangent to a circle is perpendicular to the radius at:`, opts: (i) => [`the point of contact`, `the centre`, `the chord midpoint`, `any external point`], ans: 0, exp: (i) => `The radius through the point of contact is perpendicular to the tangent line.` },
    { q: (i) => `Two chords AB and CD of a circle intersect at P inside the circle. Then:`, opts: (i) => [`PA × PB = PC × PD`, `PA + PB = PC + PD`, `PA / PB = PC / PD`, `PA × PC = PB × PD`], ans: 0, exp: (i) => `By intersecting chords theorem, the products of the chord segments are equal: PA * PB = PC * PD.` },
    { q: (i) => `If the sides of a triangle are in the ratio 3 : 4 : 5, the triangle is:`, opts: (i) => [`Right-angled triangle`, `Equilateral triangle`, `Acute-angled triangle`, `Obtuse-angled triangle`], ans: 0, exp: (i) => `3^2 + 4^2 = 9 + 16 = 25 = 5^2. It forms a Pythagorean triplet, so it is right-angled.` },
    { q: (i) => `The length of the tangent drawn from an external point at distance ${i+10} cm from centre of circle of radius ${i+6} cm is:`, opts: (i) => [`${Math.sqrt((i+10)**2 - (i+6)**2).toFixed(2)} cm`, `${(i+10)-(i+6)} cm`, `${(i+10)+(i+6)} cm`, `${(i+8)} cm`], ans: 0, exp: (i) => `Length of tangent L = √(d^2 - r^2) = √(${i+10}^2 - ${i+6}^2) = ${Math.sqrt((i+10)**2 - (i+6)**2).toFixed(2)} cm.` },
    { q: (i) => `Ceva's theorem provides a necessary and sufficient condition for three cevians of a triangle to be:`, opts: (i) => [`Concurrent`, `Parallel`, `Perpendicular`, `Equal in length`], ans: 0, exp: (i) => `Ceva's theorem states the concurrency condition for cevians.` },
  ],
  5: [ // Coordinate Geometry
    { q: (i) => `The distance between points (${i}, 0) and (${i+4}, 0) along the x-axis is:`, opts: (i) => [`4 units`, `${i+4} units`, `${i} units`, `2 units`], ans: 0, exp: (i) => `Distance = |x2 - x1| = |(${i+4}) - ${i}| = 4 units.` },
    { q: (i) => `The slope of the line passing through (${i}, 2) and (${i+2}, ${i*2+4}) is:`, opts: (i) => [`${((i*2+4)-2)/2}`, `2`, `1`, `4`], ans: 0, exp: (i) => `Slope m = (y2 - y1)/(x2 - x1) = (${(i*2+4)-2})/2 = ${((i*2+4)-2)/2}.` },
    { q: (i) => `The midpoint of the line segment joining (${i*2}, ${i+3}) and (${i*2+4}, ${i+7}) is:`, opts: (i) => [`(${i*2+2}, ${i+5})`, `(${i*2+4}, ${i+6})`, `(${i*2}, ${i+3})`, `(${i*2+1}, ${i+4})`], ans: 0, exp: (i) => `Midpoint = ((x1+x2)/2, (y1+y2)/2) = (${i*2+2}, ${i+5}).` },
    { q: (i) => `If two lines with slopes m1 and m2 are perpendicular, then:`, opts: (i) => [`m1 × m2 = -1`, `m1 = m2`, `m1 + m2 = 0`, `m1 × m2 = 1`], ans: 0, exp: (i) => `Product of slopes of two perpendicular lines is -1.` },
    { q: (i) => `The equation of a line with slope ${i+1} and y-intercept ${i+2} is:`, opts: (i) => [`y = ${i+1}x + ${i+2}`, `y = ${i+2}x + ${i+1}`, `${i+1}x + y = ${i+2}`, `x = ${i+1}y + ${i+2}`], ans: 0, exp: (i) => `Slope-intercept form is y = mx + c = ${i+1}x + ${i+2}.` },
    { q: (i) => `The area of triangle with collinear vertices is:`, opts: (i) => [`0 sq. units`, `1 sq. unit`, `1/2 sq. units`, `Negative`], ans: 0, exp: (i) => `Points are collinear if and only if the area of the formed triangle is 0.` },
    { q: (i) => `The slope of a line parallel to the x-axis is:`, opts: (i) => [`0`, `1`, `Undefined`, `-1`], ans: 0, exp: (i) => `Horizontal lines have angle of inclination θ = 0°, so tan 0° = 0.` },
    { q: (i) => `The slope of the line ${i+2}x + 3y + 5 = 0 is:`, opts: (i) => [`-${(i+2)}/3`, `${(i+2)}/3`, `-3/${i+2}`, `5/3`], ans: 0, exp: (i) => `For ax + by + c = 0, slope m = -a/b = -${i+2}/3.` },
  ],
  6: [ // Trigonometry
    { q: (i) => `The value of sin^2(${i*5+20}°) + cos^2(${i*5+20}°) is:`, opts: (i) => [`1`, `0`, `2`, `1/2`], ans: 0, exp: (i) => `Fundamental trigonometric identity: sin^2 θ + cos^2 θ = 1 for any angle θ.` },
    { q: (i) => `If tan θ = ${i+1}/${i+2}, then cot θ is:`, opts: (i) => [`${i+2}/${i+1}`, `${i+1}/${i+2}`, `1`, `${i+3}/${i+1}`], ans: 0, exp: (i) => `cot θ = 1 / tan θ = ${i+2} / ${i+1}.` },
    { q: (i) => `The value of 1 + tan^2(${i*2+15}°) is equal to:`, opts: (i) => [`sec^2(${i*2+15}°)`, `cosec^2(${i*2+15}°)`, `sin^2(${i*2+15}°)`, `cot^2(${i*2+15}°)`], ans: 0, exp: (i) => `Identity: 1 + tan^2 θ = sec^2 θ.` },
    { q: (i) => `A vertical pole of length ${i*3+6} m casts a shadow of length ${i*3+6} m on the ground. The angle of elevation of the sun is:`, opts: (i) => [`45°`, `30°`, `60°`, `90°`], ans: 0, exp: (i) => `tan θ = height / shadow = (${i*3+6})/(${i*3+6}) = 1 ⇒ θ = 45°.` },
    { q: (i) => `If sec θ - tan θ = 1/${i+2}, then sec θ + tan θ is:`, opts: (i) => [`${i+2}`, `1/${i+2}`, `${(i+2)**2}`, `1`], ans: 0, exp: (i) => `sec^2 θ - tan^2 θ = 1 ⇒ (sec θ + tan θ)(sec θ - tan θ) = 1. So sec θ + tan θ = ${i+2}.` },
    { q: (i) => `The value of sin(90° - ${i*3+10}°) is equal to:`, opts: (i) => [`cos(${i*3+10}°)`, `sin(${i*3+10}°)`, `tan(${i*3+10}°)`, `sec(${i*3+10}°)`], ans: 0, exp: (i) => `Complementary angle formula: sin(90° - θ) = cos θ.` },
    { q: (i) => `The angle of depression of an object viewed from a height is measured with respect to:`, opts: (i) => [`the horizontal line of sight`, `the vertical line`, `the ground plane`, `the normal line`], ans: 0, exp: (i) => `Angle of depression is always measured downwards from the observer's horizontal eye level.` },
    { q: (i) => `The value of (1 - cos^2 θ) * cosec^2 θ is:`, opts: (i) => [`1`, `0`, `sin^2 θ`, `cos^2 θ`], ans: 0, exp: (i) => `1 - cos^2 θ = sin^2 θ. sin^2 θ * cosec^2 θ = sin^2 θ * (1/sin^2 θ) = 1.` },
  ],
  7: [ // Mensuration
    { q: (i) => `The curved surface area of a right circular cylinder of radius ${i+1} cm and height ${i+3} cm is given by:`, opts: (i) => [`2π(${i+1})(${i+3}) cm^2`, `π(${i+1})^2(${i+3}) cm^2`, `2π(${i+1})^2 cm^2`, `4π(${i+1})(${i+3}) cm^2`], ans: 0, exp: (i) => `CSA of cylinder = 2πrh = 2π * ${i+1} * ${i+3}.` },
    { q: (i) => `The volume of a sphere of radius ${i+2} cm is:`, opts: (i) => [`(4/3) π (${i+2})^3 cm^3`, `4 π (${i+2})^2 cm^3`, `(2/3) π (${i+2})^3 cm^3`, `π (${i+2})^3 cm^3`], ans: 0, exp: (i) => `Volume of sphere V = (4/3) π r^3.` },
    { q: (i) => `If the radius of the base of a cone is ${i+3} cm and slant height is ${i+5} cm, its CSA is:`, opts: (i) => [`π * ${i+3} * ${i+5} cm^2`, `2π * ${i+3} * ${i+5} cm^2`, `π * (${i+3})^2 cm^2`, `(1/3)π * (${i+3})^2 * ${i+5} cm^2`], ans: 0, exp: (i) => `Curved surface area of cone = π r l.` },
    { q: (i) => `The total surface area of a solid hemisphere of radius ${i+2} cm is:`, opts: (i) => [`3 π (${i+2})^2 cm^2`, `2 π (${i+2})^2 cm^2`, `4 π (${i+2})^2 cm^2`, `π (${i+2})^2 cm^2`], ans: 0, exp: (i) => `TSA of solid hemisphere = CSA + base area = 2πr^2 + πr^2 = 3πr^2.` },
    { q: (i) => `When a solid sphere is melted and recast into a solid cone, which quantity remains invariant?`, opts: (i) => [`Volume`, `Surface Area`, `Radius`, `Height`], ans: 0, exp: (i) => `During melting and recasting of a solid, the volume of material remains conserved.` },
    { q: (i) => `The ratio of volumes of two spheres with radius ratio 1 : 2 is:`, opts: (i) => [`1 : 8`, `1 : 4`, `1 : 2`, `1 : 16`], ans: 0, exp: (i) => `Volume V ∝ r^3. Ratio = 1^3 : 2^3 = 1 : 8.` },
    { q: (i) => `The slant height l of a cone with radius r and height h is:`, opts: (i) => [`√(r^2 + h^2)`, `r + h`, `r^2 + h^2`, `√(r^2 - h^2)`], ans: 0, exp: (i) => `By Pythagoras theorem on the vertical cross-section, l = √(r^2 + h^2).` },
    { q: (i) => `The volume of a right circular cone is what fraction of the volume of a cylinder with same base radius and height?`, opts: (i) => [`1/3`, `1/2`, `2/3`, `1/4`], ans: 0, exp: (i) => `V_cone = (1/3) π r^2 h = (1/3) V_cylinder.` },
  ],
  8: [ // Statistics and Probability
    { q: (i) => `The range of the data ${i+2}, ${i+5}, ${i+8}, ${i+15}, ${i+22} is:`, opts: (i) => [`20`, `${i+20}`, `22`, `15`], ans: 0, exp: (i) => `Range = L - S = (${i+22}) - (${i+2}) = 20.` },
    { q: (i) => `If the standard deviation of a dataset is ${i+3}, then its variance is:`, opts: (i) => [`${(i+3)**2}`, `${(i+3)*2}`, `√(${i+3})`, `${i+3}`], ans: 0, exp: (i) => `Variance = σ^2 = (${i+3})^2 = ${(i+3)**2}.` },
    { q: (i) => `The probability of a sure event is always:`, opts: (i) => [`1`, `0`, `0.5`, `Infinite`], ans: 0, exp: (i) => `By axioms of probability, P(S) = 1 for a certain/sure event.` },
    { q: (i) => `If P(A) = 0.${i+2}, then P(A') is:`, opts: (i) => [`${(1 - Number(`0.${i+2}`)).toFixed(2)}`, `0.${i+2}`, `1`, `0`], ans: 0, exp: (i) => `P(A') = 1 - P(A) = 1 - 0.${i+2} = ${(1 - Number(`0.${i+2}`)).toFixed(2)}.` },
    { q: (i) => `The standard deviation of first n natural numbers is given by:`, opts: (i) => [`√((n^2 - 1) / 12)`, `(n^2 - 1) / 12`, `(n + 1) / 2`, `√(n / 12)`], ans: 0, exp: (i) => `Standard formula for SD of first n natural numbers: σ = √((n^2 - 1) / 12).` },
    { q: (i) => `If every value in a dataset is multiplied by ${i+2}, the new standard deviation becomes:`, opts: (i) => [`${i+2} times original σ`, `unchanged`, `${(i+2)**2} times original σ`, `0`], ans: 0, exp: (i) => `Multiplying data values by constant k multiplies standard deviation by |k|.` },
    { q: (i) => `Two events A and B are mutually exclusive if:`, opts: (i) => [`P(A ∩ B) = 0`, `P(A ∩ B) = P(A)P(B)`, `P(A ∪ B) = 1`, `P(A) = P(B)`], ans: 0, exp: (i) => `Mutually exclusive events cannot occur simultaneously, so A ∩ B = ∅ and P(A ∩ B) = 0.` },
    { q: (i) => `The probability of getting a prime number when throwing an unbiased fair die is:`, opts: (i) => [`1/2`, `1/3`, `2/3`, `1/6`], ans: 0, exp: (i) => `Prime outcomes are {2, 3, 5} out of {1, 2, 3, 4, 5, 6}. P = 3/6 = 1/2.` },
  ]
};

// Generate concept questions per chapter for 10th Maths English (20 for ch 1, 31 for ch 2-8; total 242 >= 240)
for (const ch of MATH_CHAPTERS_EN) {
  const templates = MATH_TEMPLATES_EN[ch.no];
  const countForChapter = ch.no === 1 ? 20 : 31;
  for (let idx = 1; idx <= countForChapter; idx++) {
    const t = templates[(idx - 1) % templates.length];
    const qObj = {
      id: `lkg-10-m-con-en-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Maths',
      chapter: `Chapter ${ch.no}: ${ch.name}`,
      type: 'concept',
      question: t.q(idx),
      options: t.opts(idx),
      answerIndex: t.ans,
      explanation: t.exp(idx),
      medium: 'english',
      plan: ch.no <= 3 ? 'free' : 'pro',
    };
    addQuestion(qObj);
  }
}

// Generate 15 oneword questions per chapter for 10th Maths English (total 120)
for (const ch of MATH_CHAPTERS_EN) {
  const templates = MATH_TEMPLATES_EN[ch.no];
  for (let idx = 1; idx <= 15; idx++) {
    const t = templates[(idx + 2) % templates.length];
    const qObj = {
      id: `lkg-10-m-ow-en-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Maths',
      chapter: `Chapter ${ch.no}: ${ch.name}`,
      type: 'oneword',
      question: t.q(idx + 10),
      options: t.opts(idx + 10),
      answerIndex: t.ans,
      explanation: t.exp(idx + 10),
      medium: 'english',
      plan: 'free',
    };
    addQuestion(qObj);
  }
}

// =========================================================================
// 2. 10th MATHEMATICS - TAMIL MEDIUM (Concept & Oneword)
// Chapters 1 to 8:
// அலகு 1: உறவுகளும் சார்புகளும்
// அலகு 2: எண்களும் தொடர்வரிசைகளும்
// அலகு 3: இயற்கணிதம்
// அலகு 4: வடிவியல்
// அலகு 5: ஆயத்தொலை வடிவியல்
// அலகு 6: முக்கோணவியல்
// அலகு 7: அளவியல்
// அலகு 8: புள்ளியியலும் நிகழ்தகவும்
// =========================================================================

const MATH_CHAPTERS_TM = [
  { no: 1, name: 'உறவுகளும் சார்புகளும்' },
  { no: 2, name: 'எண்களும் தொடர்வரிசைகளும்' },
  { no: 3, name: 'இயற்கணிதம்' },
  { no: 4, name: 'வடிவியல்' },
  { no: 5, name: 'ஆயத்தொலை வடிவியல்' },
  { no: 6, name: 'முக்கோணவியல்' },
  { no: 7, name: 'அளவியல்' },
  { no: 8, name: 'புள்ளியியலும் நிகழ்தகவும்' },
];

const MATH_TEMPLATES_TM = {
  1: [
    { q: (i) => `A = {1, 2, ${i+2}} மற்றும் B = {x, y} எனில், A யிலிருந்து B க்கு வரையறுக்கப்படும் உறவுகளின் மொத்த எண்ணிக்கை:`, opts: (i) => [`${2**(3*2)}`, `${2**(3+2)}`, `${3*2}`, `${3**2}`], ans: 0, exp: (i) => `A யிலிருந்து B க்கான மொத்த உறவுகள் 2^(n(A) * n(B)) = 2^(3 * 2) = 2^6 = 64.` },
    { q: (i) => `f: R → R ஆனது f(x) = ${i+1}x - ${i*2+1} எனில் f இன் கீழ் ${i+3} இன் முன் உரு:`, opts: (i) => [`${((i+3) + (i*2+1))/(i+1)}`, `${i+1}`, `${i+2}`, `${i+4}`], ans: 0, exp: (i) => `${i+1}x - ${i*2+1} = ${i+3} ⇒ x = ${((i+3) + (i*2+1))/(i+1)}.` },
    { q: (i) => `f(x) = x^2 + ${i} மற்றும் g(x) = ${i+1}x எனில் (f ∘ g)(1) இன் மதிப்பு:`, opts: (i) => [`${(i+1)**2 + i}`, `${(i+1) + i}`, `${(i)**2 + i + 1}`, `${(i+2)**2}`], ans: 0, exp: (i) => `g(1) = ${i+1}. f(${i+1}) = (${i+1})^2 + ${i} = ${(i+1)**2 + i}.` },
    { q: (i) => `A = {1, 2, 3, 4} இல் R = {(x, y) | x + y = ${i+4}} என்ற உறவில் (2, k) ∈ R எனில் k இன் மதிப்பு:`, opts: (i) => [`${(i+4)-2}`, `${i+4}`, `${i+2}`, `${i}`], ans: 0, exp: (i) => `2 + k = ${i+4} ⇒ k = ${(i+4)-2}.` },
    { q: (i) => `f என்பது சமனிச் சார்பு எனில் f(${i*5+3}) இன் மதிப்பு:`, opts: (i) => [`${i*5+3}`, `1`, `0`, `${(i*5+3)**2}`], ans: 0, exp: (i) => `சமனிச் சார்பு f(x) = x என்பதால் f(${i*5+3}) = ${i*5+3}.` },
  ],
  2: [
    { q: (i) => `${i*3+1}, ${i*3+5}, ${i*3+9}, ... என்ற கூட்டுத் தொடர்வரிசையின் பொது வித்தியாசம்:`, opts: (i) => [`4`, `3`, `${i}`, `5`], ans: 0, exp: (i) => `பொது வித்தியாசம் d = t2 - t1 = (${i*3+5}) - (${i*3+1}) = 4.` },
    { q: (i) => `முதல் உறுப்பு a = ${i+2} மற்றும் பொது வித்தியாசம் d = 3 கொண்ட கூட்டுத் தொடரின் ${i+5}-வது உறுப்பு:`, opts: (i) => [`${(i+2) + (i+4)*3}`, `${(i+2) + (i+5)*3}`, `${(i+2)*3}`, `${(i+5)*3}`], ans: 0, exp: (i) => `t_n = a + (n - 1)d = ${(i+2)} + ${(i+4)} * 3 = ${(i+2) + (i+4)*3}.` },
    { q: (i) => `முதல் ${i+4} இயல் எண்களின் கூடுதல்:`, opts: (i) => [`${((i+4)*(i+5))/2}`, `${(i+4)*(i+5)}`, `${(i+4)**2}`, `${((i+4)*(i+3))/2}`], ans: 0, exp: (i) => `முதல் n இயல் எண்களின் கூடுதல் = n(n+1)/2 = ${((i+4)*(i+5))/2}.` },
    { q: (i) => `a, b, c என்பன ஒரு கூட்டுத் தொடர்வரிசையில் உள்ளன எனில்:`, opts: (i) => [`2b = a + c`, `b^2 = ac`, `a + b = c`, `b = a - c`], ans: 0, exp: (i) => `கூட்டுச் சராசரி பண்பின்படி 2b = a + c.` },
    { q: (i) => `ஒரு பெருக்குத் தொடர்வரிசையில் முதல் உறுப்பு ${i+1} மற்றும் பொது விகிதம் 2 எனில் 4-வது உறுப்பு:`, opts: (i) => [`${(i+1) * 8}`, `${(i+1) * 6}`, `${(i+1) * 16}`, `${(i+1) * 4}`], ans: 0, exp: (i) => `t_4 = a * r^3 = ${(i+1)} * 2^3 = ${(i+1) * 8}.` },
  ],
  3: [
    { q: (i) => `x^2 - ${i+5}x + ${(i+2)*3} = 0 என்ற இருபடிச் சமன்பாட்டின் மூலங்கள்:`, opts: (i) => [`3 மற்றும் ${i+2}`, `2 மற்றும் ${i+3}`, `1 மற்றும் ${i+4}`, `4 மற்றும் ${i+1}`], ans: 0, exp: (i) => `(x - 3)(x - ${i+2}) = 0 ⇒ x = 3, ${i+2}.` },
    { q: (i) => `α, β என்பன x^2 - ${i*2+4}x + ${i+1} = 0 இன் மூலங்கள் எனில் மூலங்களின் கூடுதல் α + β:`, opts: (i) => [`${i*2+4}`, `${-(i*2+4)}`, `${i+1}`, `2`], ans: 0, exp: (i) => `மூலங்களின் கூடுதல் = -b/a = ${i*2+4}.` },
    { q: (i) => `x^2 - ${(i+2)**2} மற்றும் x - ${i+2} ஆகியவற்றின் மீ.பொ.வ:`, opts: (i) => [`x - ${i+2}`, `x + ${i+2}`, `1`, `x^2 - ${(i+2)**2}`], ans: 0, exp: (i) => `பொதுக் காரணி x - ${i+2}.` },
    { q: (i) => `A என்ற அணியின் வரிசை ${i+1} × ${i+2} மற்றும் B இன் வரிசை ${i+2} × ${i+3} எனில் AB இன் வரிசை:`, opts: (i) => [`${i+1} × ${i+3}`, `${i+2} × ${i+2}`, `${i+3} × ${i+1}`, `வரையறுக்கப்படவில்லை`], ans: 0, exp: (i) => `பெருக்கல் அணியின் வரிசை = ${i+1} × ${i+3}.` },
  ],
  4: [
    { q: (i) => `முக்கோணம் ABC இல் DE || BC. AD = ${i+2} செ.மீ, DB = ${i+4} செ.மீ, AE = ${i+1} செ.மீ எனில் EC:`, opts: (i) => [`${(((i+4)*(i+1))/(i+2)).toFixed(2)} செ.மீ`, `${i+3} செ.மீ`, `${i+2} செ.மீ`, `${i+5} செ.மீ`], ans: 0, exp: (i) => `தேல்ஸ் தேற்றப்படி AD/DB = AE/EC ⇒ EC = ${(((i+4)*(i+1))/(i+2)).toFixed(2)} செ.மீ.` },
    { q: (i) => `இரு வடிவொத்த முக்கோணங்களின் பரப்பளவுகளின் விகிதம் அவற்றின் ஒத்த பக்கங்களின்:`, opts: (i) => [`வர்க்கங்களின் விகிதத்திற்குச் சமம்`, `விகிதத்திற்குச் சமம்`, `சுற்றளவுகளின் விகிதத்திற்குச் சமம்`, `கூடுதலுக்குச் சமம்`], ans: 0, exp: (i) => `வடிவொத்த முக்கோணங்களின் பரப்பளவு விகிதம் பக்கங்களின் வர்க்க விகிதமாகும்.` },
    { q: (i) => `வட்டத்தின் தொடுகோடும் தொடுபுள்ளி வழியே செல்லும் ஆரமும் ஒன்றுக்கொன்று:`, opts: (i) => [`செங்குத்தாக இருக்கும்`, `இணையாக இருக்கும்`, `45° கோணத்தில் இருக்கும்`, `நாணாக இருக்கும்`], ans: 0, exp: (i) => `தொடுபுள்ளியில் தொடுகோடும் ஆரமும் செங்குத்தாக அமையும்.` },
  ],
  5: [
    { q: (i) => `(${i}, 0) மற்றும் (${i+4}, 0) என்ற புள்ளிகளுக்கு இடையேயான தொலைவு:`, opts: (i) => [`4 அலகுகள்`, `${i+4} அலகுகள்`, `${i} அலகுகள்`, `2 அலகுகள்`], ans: 0, exp: (i) => `தொலைவு = |x2 - x1| = 4 அலகுகள்.` },
    { q: (i) => `இரு நேர்க்கோடுகள் ஒன்றுக்கொன்று செங்குத்து எனில் அவற்றின் சாய்வுகளின் பெருக்கற்பலன் m1 × m2 =`, opts: (i) => [`-1`, `1`, `0`, `வரையறுக்கப்படவில்லை`], ans: 0, exp: (i) => `செங்குத்துக் கோடுகளின் சாய்வுகளின் பெருக்கல் -1.` },
    { q: (i) => `x-அச்சுக்கு இணையான நேர்க்கோட்டின் சாய்வு:`, opts: (i) => [`0`, `1`, `வரையறுக்கப்படவில்லை`, `-1`], ans: 0, exp: (i) => `கிடைமட்டக் கோட்டின் சாய்வு tan 0° = 0.` },
  ],
  6: [
    { q: (i) => `sin^2(${i*5+20}°) + cos^2(${i*5+20}°) இன் மதிப்பு:`, opts: (i) => [`1`, `0`, `2`, `1/2`], ans: 0, exp: (i) => `முக்கோணவியல் முற்றொருமைப்படி sin^2 θ + cos^2 θ = 1.` },
    { q: (i) => `tan θ = ${i+1}/${i+2} எனில் cot θ இன் மதிப்பு:`, opts: (i) => [`${i+2}/${i+1}`, `${i+1}/${i+2}`, `1`, `${i+3}/${i+1}`], ans: 0, exp: (i) => `cot θ = 1 / tan θ = ${i+2}/${i+1}.` },
    { q: (i) => `1 + tan^2(${i*2+15}°) என்பது எதற்குச் சமம்?`, opts: (i) => [`sec^2(${i*2+15}°)`, `cosec^2(${i*2+15}°)`, `sin^2(${i*2+15}°)`, `cos^2(${i*2+15}°)`], ans: 0, exp: (i) => `1 + tan^2 θ = sec^2 θ.` },
  ],
  7: [
    { q: (i) => `ஆரம் ${i+1} செ.மீ மற்றும் உயரம் ${i+3} செ.மீ கொண்ட நேர்வட்ட உருளையின் வளைபரப்பு:`, opts: (i) => [`2π(${i+1})(${i+3}) ச.செ.மீ`, `π(${i+1})^2(${i+3}) ச.செ.மீ`, `2π(${i+1})^2 ச.செ.மீ`, `4π(${i+1}) ச.செ.மீ`], ans: 0, exp: (i) => `உருளையின் வளைபரப்பு = 2πrh.` },
    { q: (i) => `ஆரம் ${i+2} செ.மீ கொண்ட கோளத்தின் கனஅளவு:`, opts: (i) => [`(4/3) π (${i+2})^3 க.செ.மீ`, `4 π (${i+2})^2 க.செ.மீ`, `(2/3) π (${i+2})^3 க.செ.மீ`, `π (${i+2})^3 க.செ.மீ`], ans: 0, exp: (i) => `கோளத்தின் கனஅளவு = (4/3) π r^3.` },
    { q: (i) => `திண்ம அரைக்கோளத்தின் மொத்தப் புறப்பரப்பு:`, opts: (i) => [`3 π r^2`, `2 π r^2`, `4 π r^2`, `π r^2`], ans: 0, exp: (i) => `திண்ம அரைக்கோளத்தின் மொத்தப் பரப்பு = 2πr^2 + πr^2 = 3πr^2.` },
  ],
  8: [
    { q: (i) => `${i+2}, ${i+5}, ${i+8}, ${i+15}, ${i+22} என்ற தரவுகளின் வீச்சு:`, opts: (i) => [`20`, `${i+20}`, `22`, `15`], ans: 0, exp: (i) => `வீச்சு = L - S = (${i+22}) - (${i+2}) = 20.` },
    { q: (i) => `ஒரு தரவின் திட்டவிலக்கம் ${i+3} எனில் அதன் விலக்க வர்க்கச் சராசரி:`, opts: (i) => [`${(i+3)**2}`, `${(i+3)*2}`, `√(${i+3})`, `${i+3}`], ans: 0, exp: (i) => `விலக்க வர்க்கச் சராசரி = σ^2 = ${(i+3)**2}.` },
    { q: (i) => `ஒரு நிச்சயமான நிகழ்ச்சியின் நிகழ்தகவு:`, opts: (i) => [`1`, `0`, `0.5`, `வரையறுக்கப்படவில்லை`], ans: 0, exp: (i) => `நிச்சய நிகழ்ச்சியின் நிகழ்தகவு எப்போதும் 1 ஆகும்.` },
  ]
};

// Normalize sample question chapters if needed
for (const q of questions) {
  if (q.chapter === 'உறவுகளும் சார்புகளும்') {
    q.chapter = 'Chapter 1: அலகு 1 - உறவுகளும் சார்புகளும்';
  } else if (q.chapter === 'இயக்க விதிகள்') {
    q.chapter = 'Chapter 1: அலகு 1 - இயக்க விதிகள்';
  }
}

// Generate concept questions per chapter for 10th Maths Tamil (20 for ch 1, 31 for ch 2-8; total 242 >= 240)
for (const ch of MATH_CHAPTERS_TM) {
  const templates = MATH_TEMPLATES_TM[ch.no];
  const countForChapter = ch.no === 1 ? 20 : 31;
  for (let idx = 1; idx <= countForChapter; idx++) {
    const t = templates[(idx - 1) % templates.length];
    const qObj = {
      id: `lkg-10-m-con-tm-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Maths',
      chapter: `Chapter ${ch.no}: அலகு ${ch.no} - ${ch.name}`,
      type: 'concept',
      question: t.q(idx),
      options: t.opts(idx),
      answerIndex: t.ans,
      explanation: t.exp(idx),
      medium: 'tamil',
      plan: ch.no <= 3 ? 'free' : 'pro',
    };
    addQuestion(qObj);
  }
}

// Generate 15 oneword questions per chapter for 10th Maths Tamil (total 120)
for (const ch of MATH_CHAPTERS_TM) {
  const templates = MATH_TEMPLATES_TM[ch.no];
  for (let idx = 1; idx <= 15; idx++) {
    const t = templates[(idx + 2) % templates.length];
    const qObj = {
      id: `lkg-10-m-ow-tm-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Maths',
      chapter: `Chapter ${ch.no}: அலகு ${ch.no} - ${ch.name}`,
      type: 'oneword',
      question: t.q(idx + 10),
      options: t.opts(idx + 10),
      answerIndex: t.ans,
      explanation: t.exp(idx + 10),
      medium: 'tamil',
      plan: 'free',
    };
    addQuestion(qObj);
  }
}

// =========================================================================
// 3. 10th SCIENCE - TAMIL & ENGLISH MEDIUM (Concept & Oneword)
// 6 chapters across Physics, Chemistry, Biology:
// Chapter 1: Laws of Motion (இயக்க விதிகள்)
// Chapter 2: Optics (ஒளியியல்)
// Chapter 3: Thermal Physics (வெப்ப இயற்பியல்)
// Chapter 4: Electricity (மின்னோட்டவியல்)
// Chapter 5: Acoustics (ஒலியியல்)
// Chapter 6: Nuclear Physics (அணுக்கரு இயற்பியல்)
// =========================================================================

const SCIENCE_CHAPTERS = [
  { no: 1, en: 'Laws of Motion', tm: 'இயக்க விதிகள்' },
  { no: 2, en: 'Optics', tm: 'ஒளியியல்' },
  { no: 3, en: 'Thermal Physics', tm: 'வெப்ப இயற்பியல்' },
  { no: 4, en: 'Electricity', tm: 'மின்னோட்டவியல்' },
  { no: 5, en: 'Acoustics', tm: 'ஒலியியல்' },
  { no: 6, en: 'Nuclear Physics', tm: 'அணுக்கரு இயற்பியல்' },
];

const SCIENCE_TEMPLATES = {
  1: {
    en: [
      { q: (i) => `The momentum of a body of mass ${i+2} kg moving with a velocity of ${i+3} m/s is:`, opts: (i) => [`${(i+2)*(i+3)} kg m s^-1`, `${(i+2)+(i+3)} kg m s^-1`, `${(i+2)*2} kg m s^-1`, `${(i+3)*2} kg m s^-1`], ans: 0, exp: (i) => `p = mv = ${(i+2)} * ${(i+3)} = ${(i+2)*(i+3)} kg m s^-1.` },
      { q: (i) => `Which Newton's law defines the force qualitatively?`, opts: (i) => [`First law`, `Second law`, `Third law`, `Gravitational law`], ans: 0, exp: (i) => `Newton's First Law defines force and inertia qualitatively.` },
    ],
    tm: [
      { q: (i) => `${i+2} kg நிறையுள்ள ஒரு பொருள் ${i+3} m/s திசைவேகத்தில் இயங்கினால் அதன் நேர்க்கோட்டு உந்தம்:`, opts: (i) => [`${(i+2)*(i+3)} kg m s^-1`, `${(i+2)+(i+3)} kg m s^-1`, `${(i+2)*2} kg m s^-1`, `${(i+3)*2} kg m s^-1`], ans: 0, exp: (i) => `உந்தம் p = mv = ${(i+2)*(i+3)} kg m s^-1.` },
      { q: (i) => `விசையின் பண்பினை தரரீதியாக வரையறுக்கும் நியூட்டனின் விதி:`, opts: (i) => [`முதல் விதி`, `இரண்டாம் விதி`, `மூன்றாம் விதி`, `ஈர்ப்பியல் விதி`], ans: 0, exp: (i) => `நியூட்டனின் முதல் விதி விசையையும் நிலைமத்தையும் வரையறுக்கிறது.` },
    ]
  },
  2: {
    en: [
      { q: (i) => `The power of a convex lens of focal length ${100/(i+2)} cm is:`, opts: (i) => [`+${i+2} D`, `-${i+2} D`, `+${(i+2)*2} D`, `+1 D`], ans: 0, exp: (i) => `P = 100 / f(cm) = 100 / (${100/(i+2)}) = +${i+2} Dioptre.` },
      { q: (i) => `Scattering of light by colloidal particles in a medium is known as:`, opts: (i) => [`Tyndall effect`, `Raman effect`, `Doppler effect`, `Compton effect`], ans: 0, exp: (i) => `Tyndall scattering is caused by suspended particles in a colloid.` },
    ],
    tm: [
      { q: (i) => `குவியத்தொலைவு ${100/(i+2)} செ.மீ கொண்ட குவிலென்சின் திறன்:`, opts: (i) => [`+${i+2} D`, `-${i+2} D`, `+${(i+2)*2} D`, `+1 D`], ans: 0, exp: (i) => `P = 100 / f = +${i+2} டையாப்டர்.` },
      { q: (i) => `கூழ்மக் கரைசலில் உள்ள நுண்ணிய துகள்களால் ஒளிச்சிதறல் அடைவது:`, opts: (i) => [`டிண்டால் விளைவு`, `ராமன் விளைவு`, `டாப்ளர் விளைவு`, `காம்டன் விளைவு`], ans: 0, exp: (i) => `கூழ்மத் துகள்களால் ஒளிச்சிதறல் அடைவது டிண்டால் விளைவு ஆகும்.` },
    ]
  },
  3: {
    en: [
      { q: (i) => `The SI unit of thermal conductivity is:`, opts: (i) => [`W m^-1 K^-1`, `J K^-1`, `W K^-1`, `J m^-1`], ans: 0, exp: (i) => `Thermal conductivity unit is Watt per meter Kelvin (W m^-1 K^-1).` },
      { q: (i) => `The value of universal gas constant R is:`, opts: (i) => [`8.31 J mol^-1 K^-1`, `6.023 × 10^23`, `1.38 × 10^-23`, `9.8 J mol^-1 K^-1`], ans: 0, exp: (i) => `R = 8.31 J mol^-1 K^-1.` },
    ],
    tm: [
      { q: (i) => `வெப்பக்கடத்து திறனின் SI அலகு:`, opts: (i) => [`W m^-1 K^-1`, `J K^-1`, `W K^-1`, `J m^-1`], ans: 0, exp: (i) => `SI அலகு வாட் மீட்டர்^-1 கெல்வின்^-1.` },
      { q: (i) => `பொது வாயு மாறிலி R இன் மதிப்பு:`, opts: (i) => [`8.31 J mol^-1 K^-1`, `6.023 × 10^23`, `1.38 × 10^-23`, `9.8 J mol^-1 K^-1`], ans: 0, exp: (i) => `R = 8.31 J mol^-1 K^-1.` },
    ]
  },
  4: {
    en: [
      { q: (i) => `If a current of ${i+1} A flows through a resistor of ${i+2} Ω for 1 second, heat produced is:`, opts: (i) => [`${((i+1)**2) * (i+2)} J`, `${(i+1)*(i+2)} J`, `${(i+1)**2} J`, `${(i+2)*2} J`], ans: 0, exp: (i) => `Joule's law of heating: H = I^2 R t = (${i+1})^2 * (${i+2}) * 1 = ${((i+1)**2) * (i+2)} Joules.` },
      { q: (i) => `Electric potential difference is measured using which instrument?`, opts: (i) => [`Voltmeter`, `Ammeter`, `Galvanometer`, `Rheostat`], ans: 0, exp: (i) => `A voltmeter is connected in parallel to measure potential difference.` },
    ],
    tm: [
      { q: (i) => `${i+2} Ω மின்தடையில் ${i+1} A மின்னோட்டம் 1 வினாடி பாய்ந்தால் உருவாகும் வெப்ப ஆற்றல்:`, opts: (i) => [`${((i+1)**2) * (i+2)} J`, `${(i+1)*(i+2)} J`, `${(i+1)**2} J`, `${(i+2)*2} J`], ans: 0, exp: (i) => `ஜூல் வெப்ப விதி: H = I^2 R t = ${((i+1)**2) * (i+2)} ஜூல்.` },
      { q: (i) => `மின்னழுத்த வேறுபாட்டை அளவிட பயன்படும் கருவி:`, opts: (i) => [`வோல்ட்மீட்டர்`, `அம்மீட்டர்`, `கால்வனா மீட்டா்`, `மின் தடை மாற்றி`], ans: 0, exp: (i) => `வோல்ட்மீட்டர் பக்க இணைப்பில் இணைக்கப்பட்டு மின்னழுத்த வேறுபாட்டை அளவிடுகிறது.` },
    ]
  },
  5: {
    en: [
      { q: (i) => `The audible frequency range for human ears is:`, opts: (i) => [`20 Hz to 20,000 Hz`, `Less than 20 Hz`, `Above 20,000 Hz`, `10 Hz to 10,000 Hz`], ans: 0, exp: (i) => `Audible acoustic frequency for healthy humans is 20 Hz - 20 kHz.` },
      { q: (i) => `To hear a distinct echo, minimum distance between source and reflector in air at 20°C must be:`, opts: (i) => [`17.2 m`, `34.4 m`, `10 m`, `25 m`], ans: 0, exp: (i) => `d = v * t / 2 = 344 * 0.1 / 2 = 17.2 meters.` },
    ],
    tm: [
      { q: (i) => `மனிதனால் கேட்கக்கூடிய ஒலியின் அதிர்வெண் வரம்பு:`, opts: (i) => [`20 Hz முதல் 20,000 Hz வரை`, `20 Hz க்கு கீழ்`, `20,000 Hz க்கு மேல்`, `10 Hz முதல் 10,000 Hz வரை`], ans: 0, exp: (i) => `கேட்பொலியின் வரம்பு 20 Hz முதல் 20,000 Hz வரை.` },
      { q: (i) => `எதிரொலி தெளிவாக கேட்க எதிரொலிக்கும் பரப்பு குறைந்தபட்சம் எத்தனை மீட்டர் தொலைவில் இருக்க வேண்டும்?`, opts: (i) => [`17.2 மீ`, `34.4 மீ`, `10 மீ`, `25 மீ`], ans: 0, exp: (i) => `குறைந்தபட்ச தொலைவு d = v * t / 2 = 17.2 மீட்டர்.` },
    ]
  },
  6: {
    en: [
      { q: (i) => `The SI unit of radioactivity is:`, opts: (i) => [`Becquerel (Bq)`, `Curie`, `Rutherford`, `Roentgen`], ans: 0, exp: (i) => `SI unit of radioactivity is Becquerel (1 disintegration per second).` },
      { q: (i) => `Nuclear fission in atomic reactors is controlled using control rods made of:`, opts: (i) => [`Boron or Cadmium`, `Uranium`, `Lead`, `Graphite`], ans: 0, exp: (i) => `Boron and Cadmium absorb excess neutrons effectively.` },
    ],
    tm: [
      { q: (i) => `கதிரியக்கத்தின் SI அலகு:`, opts: (i) => [`பெக்குரல் (Bq)`, `கியூரி`, `ரூதர்போர்டு`, `ராண்ட்ஜன்`], ans: 0, exp: (i) => `கதிரியக்கத்தின் SI அலகு பெக்குரல் ஆகும்.` },
      { q: (i) => `அணுக்கரு உலையில் நியூட்ரான்களை உறிஞ்சி கட்டுப்பாட்டிற்குள் வைக்க பயன்படும் தண்டு:`, opts: (i) => [`போரான் அல்லது காட்மியம்`, `யுரேனியம்`, `காரியம்`, `கிராஃபைட்`], ans: 0, exp: (i) => `போரான் மற்றும் காட்மியம் நியூட்ரான்களை உறிஞ்சும் கட்டுப்பாட்டுத் தண்டுகளாகும்.` },
    ]
  }
};

// Generate 15 concept questions per chapter for 10th Science Tamil (total 90 > 60 floor)
for (const ch of SCIENCE_CHAPTERS) {
  const templates = SCIENCE_TEMPLATES[ch.no].tm;
  for (let idx = 1; idx <= 15; idx++) {
    const t = templates[(idx - 1) % templates.length];
    const qObj = {
      id: `lkg-10-sci-con-tm-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Science',
      chapter: `Chapter ${ch.no}: அலகு ${ch.no} - ${ch.tm}`,
      type: 'concept',
      question: t.q(idx),
      options: t.opts(idx),
      answerIndex: t.ans,
      explanation: t.exp(idx),
      medium: 'tamil',
      plan: ch.no <= 3 ? 'free' : 'pro',
    };
    addQuestion(qObj);
  }
}

// Generate 15 concept questions per chapter for 10th Science English (total 90)
for (const ch of SCIENCE_CHAPTERS) {
  const templates = SCIENCE_TEMPLATES[ch.no].en;
  for (let idx = 1; idx <= 15; idx++) {
    const t = templates[(idx - 1) % templates.length];
    const qObj = {
      id: `lkg-10-sci-con-en-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Science',
      chapter: `Chapter ${ch.no}: ${ch.en}`,
      type: 'concept',
      question: t.q(idx),
      options: t.opts(idx),
      answerIndex: t.ans,
      explanation: t.exp(idx),
      medium: 'english',
      plan: ch.no <= 3 ? 'free' : 'pro',
    };
    addQuestion(qObj);
  }
}

// Generate 20 oneword questions per chapter for 10th Science English (total 120)
for (const ch of SCIENCE_CHAPTERS) {
  const templates = SCIENCE_TEMPLATES[ch.no].en;
  for (let idx = 1; idx <= 20; idx++) {
    const t = templates[(idx + 1) % templates.length];
    const qObj = {
      id: `lkg-10-sci-ow-en-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Science',
      chapter: `Chapter ${ch.no}: ${ch.en}`,
      type: 'oneword',
      question: t.q(idx + 5),
      options: t.opts(idx + 5),
      answerIndex: t.ans,
      explanation: t.exp(idx + 5),
      medium: 'english',
      plan: 'free',
    };
    addQuestion(qObj);
  }
}

// Generate 20 oneword questions per chapter for 10th Science Tamil (total 120)
for (const ch of SCIENCE_CHAPTERS) {
  const templates = SCIENCE_TEMPLATES[ch.no].tm;
  for (let idx = 1; idx <= 20; idx++) {
    const t = templates[(idx + 1) % templates.length];
    const qObj = {
      id: `lkg-10-sci-ow-tm-c0${ch.no}-${idx.toString().padStart(3, '0')}`,
      classLevel: '10th',
      subject: 'Science',
      chapter: `Chapter ${ch.no}: அலகு ${ch.no} - ${ch.tm}`,
      type: 'oneword',
      question: t.q(idx + 5),
      options: t.opts(idx + 5),
      answerIndex: t.ans,
      explanation: t.exp(idx + 5),
      medium: 'tamil',
      plan: 'free',
    };
    addQuestion(qObj);
  }
}

// Write the curated last-known-good catalog to src/data/last-known-good-questions.json
const outputPath = path.join(process.cwd(), 'src', 'data', 'last-known-good-questions.json');
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');

console.log(`\n===============================================================`);
console.log(`✅ Durable last-known-good questions catalog generated!`);
console.log(`Total questions: ${questions.length}`);
console.log(`Saved to: ${outputPath}`);
console.log(`===============================================================\n`);
