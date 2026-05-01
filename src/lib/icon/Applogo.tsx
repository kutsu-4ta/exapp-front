export const Applogo = ({ height = 20, color = "#37352f" }) => {
        // 元の viewBox 914 x 192 に基づく比率
        const width = (height * 2014) / 192;

        return (
            <svg
                width={width}
                height={height}
                viewBox="0 0 914 192"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
            >
                    {/* 積み木アイコン部分 */}
                    <rect x="818" y="123" width="64" height="64" transform="rotate(90 818 123)" fill={color}/>
                    <rect x="818" y="53" width="64" height="64" transform="rotate(90 818 53)" fill={color}/>
                    {/* 動きのあるブロックだけアクセントカラーにするのもアリですが、まずは統一 */}
                    <rect x="913.328" y="37.7935" width="64.4491" height="64.4491" transform="rotate(125.903 913.328 37.7935)" fill={color}/>
                    <rect x="887" y="90" width="97" height="63" transform="rotate(90 887 90)" fill={color}/>
            </svg>
        );
};